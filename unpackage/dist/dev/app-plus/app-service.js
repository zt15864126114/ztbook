if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor;
    return this.then(
      (value) => promise.resolve(callback()).then(() => value),
      (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      })
    );
  };
}
;
if (typeof uni !== "undefined" && uni && uni.requireGlobal) {
  const global2 = uni.requireGlobal();
  ArrayBuffer = global2.ArrayBuffer;
  Int8Array = global2.Int8Array;
  Uint8Array = global2.Uint8Array;
  Uint8ClampedArray = global2.Uint8ClampedArray;
  Int16Array = global2.Int16Array;
  Uint16Array = global2.Uint16Array;
  Int32Array = global2.Int32Array;
  Uint32Array = global2.Uint32Array;
  Float32Array = global2.Float32Array;
  Float64Array = global2.Float64Array;
  BigInt64Array = global2.BigInt64Array;
  BigUint64Array = global2.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue) {
  "use strict";
  var isVue2 = false;
  function set(target, key, val) {
    if (Array.isArray(target)) {
      target.length = Math.max(target.length, key);
      target.splice(key, 1, val);
      return val;
    }
    target[key] = val;
    return val;
  }
  function del(target, key) {
    if (Array.isArray(target)) {
      target.splice(key, 1);
      return;
    }
    delete target[key];
  }
  function getDevtoolsGlobalHook() {
    return getTarget().__VUE_DEVTOOLS_GLOBAL_HOOK__;
  }
  function getTarget() {
    return typeof navigator !== "undefined" && typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {};
  }
  const isProxyAvailable = typeof Proxy === "function";
  const HOOK_SETUP = "devtools-plugin:setup";
  const HOOK_PLUGIN_SETTINGS_SET = "plugin:settings:set";
  let supported;
  let perf;
  function isPerformanceSupported() {
    var _a;
    if (supported !== void 0) {
      return supported;
    }
    if (typeof window !== "undefined" && window.performance) {
      supported = true;
      perf = window.performance;
    } else if (typeof global !== "undefined" && ((_a = global.perf_hooks) === null || _a === void 0 ? void 0 : _a.performance)) {
      supported = true;
      perf = global.perf_hooks.performance;
    } else {
      supported = false;
    }
    return supported;
  }
  function now() {
    return isPerformanceSupported() ? perf.now() : Date.now();
  }
  class ApiProxy {
    constructor(plugin, hook) {
      this.target = null;
      this.targetQueue = [];
      this.onQueue = [];
      this.plugin = plugin;
      this.hook = hook;
      const defaultSettings = {};
      if (plugin.settings) {
        for (const id in plugin.settings) {
          const item = plugin.settings[id];
          defaultSettings[id] = item.defaultValue;
        }
      }
      const localSettingsSaveId = `__vue-devtools-plugin-settings__${plugin.id}`;
      let currentSettings = Object.assign({}, defaultSettings);
      try {
        const raw = localStorage.getItem(localSettingsSaveId);
        const data = JSON.parse(raw);
        Object.assign(currentSettings, data);
      } catch (e) {
      }
      this.fallbacks = {
        getSettings() {
          return currentSettings;
        },
        setSettings(value) {
          try {
            localStorage.setItem(localSettingsSaveId, JSON.stringify(value));
          } catch (e) {
          }
          currentSettings = value;
        },
        now() {
          return now();
        }
      };
      if (hook) {
        hook.on(HOOK_PLUGIN_SETTINGS_SET, (pluginId, value) => {
          if (pluginId === this.plugin.id) {
            this.fallbacks.setSettings(value);
          }
        });
      }
      this.proxiedOn = new Proxy({}, {
        get: (_target, prop) => {
          if (this.target) {
            return this.target.on[prop];
          } else {
            return (...args) => {
              this.onQueue.push({
                method: prop,
                args
              });
            };
          }
        }
      });
      this.proxiedTarget = new Proxy({}, {
        get: (_target, prop) => {
          if (this.target) {
            return this.target[prop];
          } else if (prop === "on") {
            return this.proxiedOn;
          } else if (Object.keys(this.fallbacks).includes(prop)) {
            return (...args) => {
              this.targetQueue.push({
                method: prop,
                args,
                resolve: () => {
                }
              });
              return this.fallbacks[prop](...args);
            };
          } else {
            return (...args) => {
              return new Promise((resolve) => {
                this.targetQueue.push({
                  method: prop,
                  args,
                  resolve
                });
              });
            };
          }
        }
      });
    }
    async setRealTarget(target) {
      this.target = target;
      for (const item of this.onQueue) {
        this.target.on[item.method](...item.args);
      }
      for (const item of this.targetQueue) {
        item.resolve(await this.target[item.method](...item.args));
      }
    }
  }
  function setupDevtoolsPlugin(pluginDescriptor, setupFn) {
    const descriptor = pluginDescriptor;
    const target = getTarget();
    const hook = getDevtoolsGlobalHook();
    const enableProxy = isProxyAvailable && descriptor.enableEarlyProxy;
    if (hook && (target.__VUE_DEVTOOLS_PLUGIN_API_AVAILABLE__ || !enableProxy)) {
      hook.emit(HOOK_SETUP, pluginDescriptor, setupFn);
    } else {
      const proxy = enableProxy ? new ApiProxy(descriptor, hook) : null;
      const list = target.__VUE_DEVTOOLS_PLUGINS__ = target.__VUE_DEVTOOLS_PLUGINS__ || [];
      list.push({
        pluginDescriptor: descriptor,
        setupFn,
        proxy
      });
      if (proxy)
        setupFn(proxy.proxiedTarget);
    }
  }
  /*!
   * pinia v2.1.7
   * (c) 2023 Eduardo San Martin Morote
   * @license MIT
   */
  let activePinia;
  const setActivePinia = (pinia) => activePinia = pinia;
  const piniaSymbol = Symbol("pinia");
  function isPlainObject(o) {
    return o && typeof o === "object" && Object.prototype.toString.call(o) === "[object Object]" && typeof o.toJSON !== "function";
  }
  var MutationType;
  (function(MutationType2) {
    MutationType2["direct"] = "direct";
    MutationType2["patchObject"] = "patch object";
    MutationType2["patchFunction"] = "patch function";
  })(MutationType || (MutationType = {}));
  const IS_CLIENT = typeof window !== "undefined";
  const USE_DEVTOOLS = IS_CLIENT;
  const _global = /* @__PURE__ */ (() => typeof window === "object" && window.window === window ? window : typeof self === "object" && self.self === self ? self : typeof global === "object" && global.global === global ? global : typeof globalThis === "object" ? globalThis : { HTMLElement: null })();
  function bom(blob, { autoBom = false } = {}) {
    if (autoBom && /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
      return new Blob([String.fromCharCode(65279), blob], { type: blob.type });
    }
    return blob;
  }
  function download(url, name, opts) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "blob";
    xhr.onload = function() {
      saveAs(xhr.response, name, opts);
    };
    xhr.onerror = function() {
      console.error("could not download file");
    };
    xhr.send();
  }
  function corsEnabled(url) {
    const xhr = new XMLHttpRequest();
    xhr.open("HEAD", url, false);
    try {
      xhr.send();
    } catch (e) {
    }
    return xhr.status >= 200 && xhr.status <= 299;
  }
  function click(node) {
    try {
      node.dispatchEvent(new MouseEvent("click"));
    } catch (e) {
      const evt = document.createEvent("MouseEvents");
      evt.initMouseEvent("click", true, true, window, 0, 0, 0, 80, 20, false, false, false, false, 0, null);
      node.dispatchEvent(evt);
    }
  }
  const _navigator = typeof navigator === "object" ? navigator : { userAgent: "" };
  const isMacOSWebView = /* @__PURE__ */ (() => /Macintosh/.test(_navigator.userAgent) && /AppleWebKit/.test(_navigator.userAgent) && !/Safari/.test(_navigator.userAgent))();
  const saveAs = !IS_CLIENT ? () => {
  } : (
    // Use download attribute first if possible (#193 Lumia mobile) unless this is a macOS WebView or mini program
    typeof HTMLAnchorElement !== "undefined" && "download" in HTMLAnchorElement.prototype && !isMacOSWebView ? downloadSaveAs : (
      // Use msSaveOrOpenBlob as a second approach
      "msSaveOrOpenBlob" in _navigator ? msSaveAs : (
        // Fallback to using FileReader and a popup
        fileSaverSaveAs
      )
    )
  );
  function downloadSaveAs(blob, name = "download", opts) {
    const a = document.createElement("a");
    a.download = name;
    a.rel = "noopener";
    if (typeof blob === "string") {
      a.href = blob;
      if (a.origin !== location.origin) {
        if (corsEnabled(a.href)) {
          download(blob, name, opts);
        } else {
          a.target = "_blank";
          click(a);
        }
      } else {
        click(a);
      }
    } else {
      a.href = URL.createObjectURL(blob);
      setTimeout(function() {
        URL.revokeObjectURL(a.href);
      }, 4e4);
      setTimeout(function() {
        click(a);
      }, 0);
    }
  }
  function msSaveAs(blob, name = "download", opts) {
    if (typeof blob === "string") {
      if (corsEnabled(blob)) {
        download(blob, name, opts);
      } else {
        const a = document.createElement("a");
        a.href = blob;
        a.target = "_blank";
        setTimeout(function() {
          click(a);
        });
      }
    } else {
      navigator.msSaveOrOpenBlob(bom(blob, opts), name);
    }
  }
  function fileSaverSaveAs(blob, name, opts, popup2) {
    popup2 = popup2 || open("", "_blank");
    if (popup2) {
      popup2.document.title = popup2.document.body.innerText = "downloading...";
    }
    if (typeof blob === "string")
      return download(blob, name, opts);
    const force = blob.type === "application/octet-stream";
    const isSafari = /constructor/i.test(String(_global.HTMLElement)) || "safari" in _global;
    const isChromeIOS = /CriOS\/[\d]+/.test(navigator.userAgent);
    if ((isChromeIOS || force && isSafari || isMacOSWebView) && typeof FileReader !== "undefined") {
      const reader = new FileReader();
      reader.onloadend = function() {
        let url = reader.result;
        if (typeof url !== "string") {
          popup2 = null;
          throw new Error("Wrong reader.result type");
        }
        url = isChromeIOS ? url : url.replace(/^data:[^;]*;/, "data:attachment/file;");
        if (popup2) {
          popup2.location.href = url;
        } else {
          location.assign(url);
        }
        popup2 = null;
      };
      reader.readAsDataURL(blob);
    } else {
      const url = URL.createObjectURL(blob);
      if (popup2)
        popup2.location.assign(url);
      else
        location.href = url;
      popup2 = null;
      setTimeout(function() {
        URL.revokeObjectURL(url);
      }, 4e4);
    }
  }
  function toastMessage(message, type) {
    const piniaMessage = "🍍 " + message;
    if (typeof __VUE_DEVTOOLS_TOAST__ === "function") {
      __VUE_DEVTOOLS_TOAST__(piniaMessage, type);
    } else if (type === "error") {
      console.error(piniaMessage);
    } else if (type === "warn") {
      console.warn(piniaMessage);
    } else {
      console.log(piniaMessage);
    }
  }
  function isPinia(o) {
    return "_a" in o && "install" in o;
  }
  function checkClipboardAccess() {
    if (!("clipboard" in navigator)) {
      toastMessage(`Your browser doesn't support the Clipboard API`, "error");
      return true;
    }
  }
  function checkNotFocusedError(error) {
    if (error instanceof Error && error.message.toLowerCase().includes("document is not focused")) {
      toastMessage('You need to activate the "Emulate a focused page" setting in the "Rendering" panel of devtools.', "warn");
      return true;
    }
    return false;
  }
  async function actionGlobalCopyState(pinia) {
    if (checkClipboardAccess())
      return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(pinia.state.value));
      toastMessage("Global state copied to clipboard.");
    } catch (error) {
      if (checkNotFocusedError(error))
        return;
      toastMessage(`Failed to serialize the state. Check the console for more details.`, "error");
      console.error(error);
    }
  }
  async function actionGlobalPasteState(pinia) {
    if (checkClipboardAccess())
      return;
    try {
      loadStoresState(pinia, JSON.parse(await navigator.clipboard.readText()));
      toastMessage("Global state pasted from clipboard.");
    } catch (error) {
      if (checkNotFocusedError(error))
        return;
      toastMessage(`Failed to deserialize the state from clipboard. Check the console for more details.`, "error");
      console.error(error);
    }
  }
  async function actionGlobalSaveState(pinia) {
    try {
      saveAs(new Blob([JSON.stringify(pinia.state.value)], {
        type: "text/plain;charset=utf-8"
      }), "pinia-state.json");
    } catch (error) {
      toastMessage(`Failed to export the state as JSON. Check the console for more details.`, "error");
      console.error(error);
    }
  }
  let fileInput;
  function getFileOpener() {
    if (!fileInput) {
      fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".json";
    }
    function openFile() {
      return new Promise((resolve, reject) => {
        fileInput.onchange = async () => {
          const files = fileInput.files;
          if (!files)
            return resolve(null);
          const file = files.item(0);
          if (!file)
            return resolve(null);
          return resolve({ text: await file.text(), file });
        };
        fileInput.oncancel = () => resolve(null);
        fileInput.onerror = reject;
        fileInput.click();
      });
    }
    return openFile;
  }
  async function actionGlobalOpenStateFile(pinia) {
    try {
      const open2 = getFileOpener();
      const result = await open2();
      if (!result)
        return;
      const { text, file } = result;
      loadStoresState(pinia, JSON.parse(text));
      toastMessage(`Global state imported from "${file.name}".`);
    } catch (error) {
      toastMessage(`Failed to import the state from JSON. Check the console for more details.`, "error");
      console.error(error);
    }
  }
  function loadStoresState(pinia, state) {
    for (const key in state) {
      const storeState = pinia.state.value[key];
      if (storeState) {
        Object.assign(storeState, state[key]);
      } else {
        pinia.state.value[key] = state[key];
      }
    }
  }
  function formatDisplay(display) {
    return {
      _custom: {
        display
      }
    };
  }
  const PINIA_ROOT_LABEL = "🍍 Pinia (root)";
  const PINIA_ROOT_ID = "_root";
  function formatStoreForInspectorTree(store) {
    return isPinia(store) ? {
      id: PINIA_ROOT_ID,
      label: PINIA_ROOT_LABEL
    } : {
      id: store.$id,
      label: store.$id
    };
  }
  function formatStoreForInspectorState(store) {
    if (isPinia(store)) {
      const storeNames = Array.from(store._s.keys());
      const storeMap = store._s;
      const state2 = {
        state: storeNames.map((storeId) => ({
          editable: true,
          key: storeId,
          value: store.state.value[storeId]
        })),
        getters: storeNames.filter((id) => storeMap.get(id)._getters).map((id) => {
          const store2 = storeMap.get(id);
          return {
            editable: false,
            key: id,
            value: store2._getters.reduce((getters, key) => {
              getters[key] = store2[key];
              return getters;
            }, {})
          };
        })
      };
      return state2;
    }
    const state = {
      state: Object.keys(store.$state).map((key) => ({
        editable: true,
        key,
        value: store.$state[key]
      }))
    };
    if (store._getters && store._getters.length) {
      state.getters = store._getters.map((getterName) => ({
        editable: false,
        key: getterName,
        value: store[getterName]
      }));
    }
    if (store._customProperties.size) {
      state.customProperties = Array.from(store._customProperties).map((key) => ({
        editable: true,
        key,
        value: store[key]
      }));
    }
    return state;
  }
  function formatEventData(events) {
    if (!events)
      return {};
    if (Array.isArray(events)) {
      return events.reduce((data, event) => {
        data.keys.push(event.key);
        data.operations.push(event.type);
        data.oldValue[event.key] = event.oldValue;
        data.newValue[event.key] = event.newValue;
        return data;
      }, {
        oldValue: {},
        keys: [],
        operations: [],
        newValue: {}
      });
    } else {
      return {
        operation: formatDisplay(events.type),
        key: formatDisplay(events.key),
        oldValue: events.oldValue,
        newValue: events.newValue
      };
    }
  }
  function formatMutationType(type) {
    switch (type) {
      case MutationType.direct:
        return "mutation";
      case MutationType.patchFunction:
        return "$patch";
      case MutationType.patchObject:
        return "$patch";
      default:
        return "unknown";
    }
  }
  let isTimelineActive = true;
  const componentStateTypes = [];
  const MUTATIONS_LAYER_ID = "pinia:mutations";
  const INSPECTOR_ID = "pinia";
  const { assign: assign$1 } = Object;
  const getStoreType = (id) => "🍍 " + id;
  function registerPiniaDevtools(app, pinia) {
    setupDevtoolsPlugin({
      id: "dev.esm.pinia",
      label: "Pinia 🍍",
      logo: "https://pinia.vuejs.org/logo.svg",
      packageName: "pinia",
      homepage: "https://pinia.vuejs.org",
      componentStateTypes,
      app
    }, (api) => {
      if (typeof api.now !== "function") {
        toastMessage("You seem to be using an outdated version of Vue Devtools. Are you still using the Beta release instead of the stable one? You can find the links at https://devtools.vuejs.org/guide/installation.html.");
      }
      api.addTimelineLayer({
        id: MUTATIONS_LAYER_ID,
        label: `Pinia 🍍`,
        color: 15064968
      });
      api.addInspector({
        id: INSPECTOR_ID,
        label: "Pinia 🍍",
        icon: "storage",
        treeFilterPlaceholder: "Search stores",
        actions: [
          {
            icon: "content_copy",
            action: () => {
              actionGlobalCopyState(pinia);
            },
            tooltip: "Serialize and copy the state"
          },
          {
            icon: "content_paste",
            action: async () => {
              await actionGlobalPasteState(pinia);
              api.sendInspectorTree(INSPECTOR_ID);
              api.sendInspectorState(INSPECTOR_ID);
            },
            tooltip: "Replace the state with the content of your clipboard"
          },
          {
            icon: "save",
            action: () => {
              actionGlobalSaveState(pinia);
            },
            tooltip: "Save the state as a JSON file"
          },
          {
            icon: "folder_open",
            action: async () => {
              await actionGlobalOpenStateFile(pinia);
              api.sendInspectorTree(INSPECTOR_ID);
              api.sendInspectorState(INSPECTOR_ID);
            },
            tooltip: "Import the state from a JSON file"
          }
        ],
        nodeActions: [
          {
            icon: "restore",
            tooltip: 'Reset the state (with "$reset")',
            action: (nodeId) => {
              const store = pinia._s.get(nodeId);
              if (!store) {
                toastMessage(`Cannot reset "${nodeId}" store because it wasn't found.`, "warn");
              } else if (typeof store.$reset !== "function") {
                toastMessage(`Cannot reset "${nodeId}" store because it doesn't have a "$reset" method implemented.`, "warn");
              } else {
                store.$reset();
                toastMessage(`Store "${nodeId}" reset.`);
              }
            }
          }
        ]
      });
      api.on.inspectComponent((payload, ctx) => {
        const proxy = payload.componentInstance && payload.componentInstance.proxy;
        if (proxy && proxy._pStores) {
          const piniaStores = payload.componentInstance.proxy._pStores;
          Object.values(piniaStores).forEach((store) => {
            payload.instanceData.state.push({
              type: getStoreType(store.$id),
              key: "state",
              editable: true,
              value: store._isOptionsAPI ? {
                _custom: {
                  value: vue.toRaw(store.$state),
                  actions: [
                    {
                      icon: "restore",
                      tooltip: "Reset the state of this store",
                      action: () => store.$reset()
                    }
                  ]
                }
              } : (
                // NOTE: workaround to unwrap transferred refs
                Object.keys(store.$state).reduce((state, key) => {
                  state[key] = store.$state[key];
                  return state;
                }, {})
              )
            });
            if (store._getters && store._getters.length) {
              payload.instanceData.state.push({
                type: getStoreType(store.$id),
                key: "getters",
                editable: false,
                value: store._getters.reduce((getters, key) => {
                  try {
                    getters[key] = store[key];
                  } catch (error) {
                    getters[key] = error;
                  }
                  return getters;
                }, {})
              });
            }
          });
        }
      });
      api.on.getInspectorTree((payload) => {
        if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
          let stores = [pinia];
          stores = stores.concat(Array.from(pinia._s.values()));
          payload.rootNodes = (payload.filter ? stores.filter((store) => "$id" in store ? store.$id.toLowerCase().includes(payload.filter.toLowerCase()) : PINIA_ROOT_LABEL.toLowerCase().includes(payload.filter.toLowerCase())) : stores).map(formatStoreForInspectorTree);
        }
      });
      api.on.getInspectorState((payload) => {
        if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
          const inspectedStore = payload.nodeId === PINIA_ROOT_ID ? pinia : pinia._s.get(payload.nodeId);
          if (!inspectedStore) {
            return;
          }
          if (inspectedStore) {
            payload.state = formatStoreForInspectorState(inspectedStore);
          }
        }
      });
      api.on.editInspectorState((payload, ctx) => {
        if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
          const inspectedStore = payload.nodeId === PINIA_ROOT_ID ? pinia : pinia._s.get(payload.nodeId);
          if (!inspectedStore) {
            return toastMessage(`store "${payload.nodeId}" not found`, "error");
          }
          const { path } = payload;
          if (!isPinia(inspectedStore)) {
            if (path.length !== 1 || !inspectedStore._customProperties.has(path[0]) || path[0] in inspectedStore.$state) {
              path.unshift("$state");
            }
          } else {
            path.unshift("state");
          }
          isTimelineActive = false;
          payload.set(inspectedStore, path, payload.state.value);
          isTimelineActive = true;
        }
      });
      api.on.editComponentState((payload) => {
        if (payload.type.startsWith("🍍")) {
          const storeId = payload.type.replace(/^🍍\s*/, "");
          const store = pinia._s.get(storeId);
          if (!store) {
            return toastMessage(`store "${storeId}" not found`, "error");
          }
          const { path } = payload;
          if (path[0] !== "state") {
            return toastMessage(`Invalid path for store "${storeId}":
${path}
Only state can be modified.`);
          }
          path[0] = "$state";
          isTimelineActive = false;
          payload.set(store, path, payload.state.value);
          isTimelineActive = true;
        }
      });
    });
  }
  function addStoreToDevtools(app, store) {
    if (!componentStateTypes.includes(getStoreType(store.$id))) {
      componentStateTypes.push(getStoreType(store.$id));
    }
    setupDevtoolsPlugin({
      id: "dev.esm.pinia",
      label: "Pinia 🍍",
      logo: "https://pinia.vuejs.org/logo.svg",
      packageName: "pinia",
      homepage: "https://pinia.vuejs.org",
      componentStateTypes,
      app,
      settings: {
        logStoreChanges: {
          label: "Notify about new/deleted stores",
          type: "boolean",
          defaultValue: true
        }
        // useEmojis: {
        //   label: 'Use emojis in messages ⚡️',
        //   type: 'boolean',
        //   defaultValue: true,
        // },
      }
    }, (api) => {
      const now2 = typeof api.now === "function" ? api.now.bind(api) : Date.now;
      store.$onAction(({ after, onError, name, args }) => {
        const groupId = runningActionId++;
        api.addTimelineEvent({
          layerId: MUTATIONS_LAYER_ID,
          event: {
            time: now2(),
            title: "🛫 " + name,
            subtitle: "start",
            data: {
              store: formatDisplay(store.$id),
              action: formatDisplay(name),
              args
            },
            groupId
          }
        });
        after((result) => {
          activeAction = void 0;
          api.addTimelineEvent({
            layerId: MUTATIONS_LAYER_ID,
            event: {
              time: now2(),
              title: "🛬 " + name,
              subtitle: "end",
              data: {
                store: formatDisplay(store.$id),
                action: formatDisplay(name),
                args,
                result
              },
              groupId
            }
          });
        });
        onError((error) => {
          activeAction = void 0;
          api.addTimelineEvent({
            layerId: MUTATIONS_LAYER_ID,
            event: {
              time: now2(),
              logType: "error",
              title: "💥 " + name,
              subtitle: "end",
              data: {
                store: formatDisplay(store.$id),
                action: formatDisplay(name),
                args,
                error
              },
              groupId
            }
          });
        });
      }, true);
      store._customProperties.forEach((name) => {
        vue.watch(() => vue.unref(store[name]), (newValue, oldValue) => {
          api.notifyComponentUpdate();
          api.sendInspectorState(INSPECTOR_ID);
          if (isTimelineActive) {
            api.addTimelineEvent({
              layerId: MUTATIONS_LAYER_ID,
              event: {
                time: now2(),
                title: "Change",
                subtitle: name,
                data: {
                  newValue,
                  oldValue
                },
                groupId: activeAction
              }
            });
          }
        }, { deep: true });
      });
      store.$subscribe(({ events, type }, state) => {
        api.notifyComponentUpdate();
        api.sendInspectorState(INSPECTOR_ID);
        if (!isTimelineActive)
          return;
        const eventData = {
          time: now2(),
          title: formatMutationType(type),
          data: assign$1({ store: formatDisplay(store.$id) }, formatEventData(events)),
          groupId: activeAction
        };
        if (type === MutationType.patchFunction) {
          eventData.subtitle = "⤵️";
        } else if (type === MutationType.patchObject) {
          eventData.subtitle = "🧩";
        } else if (events && !Array.isArray(events)) {
          eventData.subtitle = events.type;
        }
        if (events) {
          eventData.data["rawEvent(s)"] = {
            _custom: {
              display: "DebuggerEvent",
              type: "object",
              tooltip: "raw DebuggerEvent[]",
              value: events
            }
          };
        }
        api.addTimelineEvent({
          layerId: MUTATIONS_LAYER_ID,
          event: eventData
        });
      }, { detached: true, flush: "sync" });
      const hotUpdate = store._hotUpdate;
      store._hotUpdate = vue.markRaw((newStore) => {
        hotUpdate(newStore);
        api.addTimelineEvent({
          layerId: MUTATIONS_LAYER_ID,
          event: {
            time: now2(),
            title: "🔥 " + store.$id,
            subtitle: "HMR update",
            data: {
              store: formatDisplay(store.$id),
              info: formatDisplay(`HMR update`)
            }
          }
        });
        api.notifyComponentUpdate();
        api.sendInspectorTree(INSPECTOR_ID);
        api.sendInspectorState(INSPECTOR_ID);
      });
      const { $dispose } = store;
      store.$dispose = () => {
        $dispose();
        api.notifyComponentUpdate();
        api.sendInspectorTree(INSPECTOR_ID);
        api.sendInspectorState(INSPECTOR_ID);
        api.getSettings().logStoreChanges && toastMessage(`Disposed "${store.$id}" store 🗑`);
      };
      api.notifyComponentUpdate();
      api.sendInspectorTree(INSPECTOR_ID);
      api.sendInspectorState(INSPECTOR_ID);
      api.getSettings().logStoreChanges && toastMessage(`"${store.$id}" store installed 🆕`);
    });
  }
  let runningActionId = 0;
  let activeAction;
  function patchActionForGrouping(store, actionNames, wrapWithProxy) {
    const actions = actionNames.reduce((storeActions, actionName) => {
      storeActions[actionName] = vue.toRaw(store)[actionName];
      return storeActions;
    }, {});
    for (const actionName in actions) {
      store[actionName] = function() {
        const _actionId = runningActionId;
        const trackedStore = wrapWithProxy ? new Proxy(store, {
          get(...args) {
            activeAction = _actionId;
            return Reflect.get(...args);
          },
          set(...args) {
            activeAction = _actionId;
            return Reflect.set(...args);
          }
        }) : store;
        activeAction = _actionId;
        const retValue = actions[actionName].apply(trackedStore, arguments);
        activeAction = void 0;
        return retValue;
      };
    }
  }
  function devtoolsPlugin({ app, store, options }) {
    if (store.$id.startsWith("__hot:")) {
      return;
    }
    store._isOptionsAPI = !!options.state;
    patchActionForGrouping(store, Object.keys(options.actions), store._isOptionsAPI);
    const originalHotUpdate = store._hotUpdate;
    vue.toRaw(store)._hotUpdate = function(newStore) {
      originalHotUpdate.apply(this, arguments);
      patchActionForGrouping(store, Object.keys(newStore._hmrPayload.actions), !!store._isOptionsAPI);
    };
    addStoreToDevtools(
      app,
      // FIXME: is there a way to allow the assignment from Store<Id, S, G, A> to StoreGeneric?
      store
    );
  }
  function createPinia() {
    const scope = vue.effectScope(true);
    const state = scope.run(() => vue.ref({}));
    let _p = [];
    let toBeInstalled = [];
    const pinia = vue.markRaw({
      install(app) {
        setActivePinia(pinia);
        {
          pinia._a = app;
          app.provide(piniaSymbol, pinia);
          app.config.globalProperties.$pinia = pinia;
          if (USE_DEVTOOLS) {
            registerPiniaDevtools(app, pinia);
          }
          toBeInstalled.forEach((plugin) => _p.push(plugin));
          toBeInstalled = [];
        }
      },
      use(plugin) {
        if (!this._a && !isVue2) {
          toBeInstalled.push(plugin);
        } else {
          _p.push(plugin);
        }
        return this;
      },
      _p,
      // it's actually undefined here
      // @ts-expect-error
      _a: null,
      _e: scope,
      _s: /* @__PURE__ */ new Map(),
      state
    });
    if (USE_DEVTOOLS && typeof Proxy !== "undefined") {
      pinia.use(devtoolsPlugin);
    }
    return pinia;
  }
  function patchObject(newState, oldState) {
    for (const key in oldState) {
      const subPatch = oldState[key];
      if (!(key in newState)) {
        continue;
      }
      const targetValue = newState[key];
      if (isPlainObject(targetValue) && isPlainObject(subPatch) && !vue.isRef(subPatch) && !vue.isReactive(subPatch)) {
        newState[key] = patchObject(targetValue, subPatch);
      } else {
        {
          newState[key] = subPatch;
        }
      }
    }
    return newState;
  }
  const noop = () => {
  };
  function addSubscription(subscriptions, callback, detached, onCleanup = noop) {
    subscriptions.push(callback);
    const removeSubscription = () => {
      const idx = subscriptions.indexOf(callback);
      if (idx > -1) {
        subscriptions.splice(idx, 1);
        onCleanup();
      }
    };
    if (!detached && vue.getCurrentScope()) {
      vue.onScopeDispose(removeSubscription);
    }
    return removeSubscription;
  }
  function triggerSubscriptions(subscriptions, ...args) {
    subscriptions.slice().forEach((callback) => {
      callback(...args);
    });
  }
  const fallbackRunWithContext = (fn) => fn();
  function mergeReactiveObjects(target, patchToApply) {
    if (target instanceof Map && patchToApply instanceof Map) {
      patchToApply.forEach((value, key) => target.set(key, value));
    }
    if (target instanceof Set && patchToApply instanceof Set) {
      patchToApply.forEach(target.add, target);
    }
    for (const key in patchToApply) {
      if (!patchToApply.hasOwnProperty(key))
        continue;
      const subPatch = patchToApply[key];
      const targetValue = target[key];
      if (isPlainObject(targetValue) && isPlainObject(subPatch) && target.hasOwnProperty(key) && !vue.isRef(subPatch) && !vue.isReactive(subPatch)) {
        target[key] = mergeReactiveObjects(targetValue, subPatch);
      } else {
        target[key] = subPatch;
      }
    }
    return target;
  }
  const skipHydrateSymbol = Symbol("pinia:skipHydration");
  function shouldHydrate(obj) {
    return !isPlainObject(obj) || !obj.hasOwnProperty(skipHydrateSymbol);
  }
  const { assign } = Object;
  function isComputed(o) {
    return !!(vue.isRef(o) && o.effect);
  }
  function createOptionsStore(id, options, pinia, hot) {
    const { state, actions, getters } = options;
    const initialState = pinia.state.value[id];
    let store;
    function setup() {
      if (!initialState && !hot) {
        {
          pinia.state.value[id] = state ? state() : {};
        }
      }
      const localState = hot ? (
        // use ref() to unwrap refs inside state TODO: check if this is still necessary
        vue.toRefs(vue.ref(state ? state() : {}).value)
      ) : vue.toRefs(pinia.state.value[id]);
      return assign(localState, actions, Object.keys(getters || {}).reduce((computedGetters, name) => {
        if (name in localState) {
          console.warn(`[🍍]: A getter cannot have the same name as another state property. Rename one of them. Found with "${name}" in store "${id}".`);
        }
        computedGetters[name] = vue.markRaw(vue.computed(() => {
          setActivePinia(pinia);
          const store2 = pinia._s.get(id);
          return getters[name].call(store2, store2);
        }));
        return computedGetters;
      }, {}));
    }
    store = createSetupStore(id, setup, options, pinia, hot, true);
    return store;
  }
  function createSetupStore($id, setup, options = {}, pinia, hot, isOptionsStore) {
    let scope;
    const optionsForPlugin = assign({ actions: {} }, options);
    if (!pinia._e.active) {
      throw new Error("Pinia destroyed");
    }
    const $subscribeOptions = {
      deep: true
      // flush: 'post',
    };
    {
      $subscribeOptions.onTrigger = (event) => {
        if (isListening) {
          debuggerEvents = event;
        } else if (isListening == false && !store._hotUpdating) {
          if (Array.isArray(debuggerEvents)) {
            debuggerEvents.push(event);
          } else {
            console.error("🍍 debuggerEvents should be an array. This is most likely an internal Pinia bug.");
          }
        }
      };
    }
    let isListening;
    let isSyncListening;
    let subscriptions = [];
    let actionSubscriptions = [];
    let debuggerEvents;
    const initialState = pinia.state.value[$id];
    if (!isOptionsStore && !initialState && !hot) {
      {
        pinia.state.value[$id] = {};
      }
    }
    const hotState = vue.ref({});
    let activeListener;
    function $patch(partialStateOrMutator) {
      let subscriptionMutation;
      isListening = isSyncListening = false;
      {
        debuggerEvents = [];
      }
      if (typeof partialStateOrMutator === "function") {
        partialStateOrMutator(pinia.state.value[$id]);
        subscriptionMutation = {
          type: MutationType.patchFunction,
          storeId: $id,
          events: debuggerEvents
        };
      } else {
        mergeReactiveObjects(pinia.state.value[$id], partialStateOrMutator);
        subscriptionMutation = {
          type: MutationType.patchObject,
          payload: partialStateOrMutator,
          storeId: $id,
          events: debuggerEvents
        };
      }
      const myListenerId = activeListener = Symbol();
      vue.nextTick().then(() => {
        if (activeListener === myListenerId) {
          isListening = true;
        }
      });
      isSyncListening = true;
      triggerSubscriptions(subscriptions, subscriptionMutation, pinia.state.value[$id]);
    }
    const $reset = isOptionsStore ? function $reset2() {
      const { state } = options;
      const newState = state ? state() : {};
      this.$patch(($state) => {
        assign($state, newState);
      });
    } : (
      /* istanbul ignore next */
      () => {
        throw new Error(`🍍: Store "${$id}" is built using the setup syntax and does not implement $reset().`);
      }
    );
    function $dispose() {
      scope.stop();
      subscriptions = [];
      actionSubscriptions = [];
      pinia._s.delete($id);
    }
    function wrapAction(name, action) {
      return function() {
        setActivePinia(pinia);
        const args = Array.from(arguments);
        const afterCallbackList = [];
        const onErrorCallbackList = [];
        function after(callback) {
          afterCallbackList.push(callback);
        }
        function onError(callback) {
          onErrorCallbackList.push(callback);
        }
        triggerSubscriptions(actionSubscriptions, {
          args,
          name,
          store,
          after,
          onError
        });
        let ret;
        try {
          ret = action.apply(this && this.$id === $id ? this : store, args);
        } catch (error) {
          triggerSubscriptions(onErrorCallbackList, error);
          throw error;
        }
        if (ret instanceof Promise) {
          return ret.then((value) => {
            triggerSubscriptions(afterCallbackList, value);
            return value;
          }).catch((error) => {
            triggerSubscriptions(onErrorCallbackList, error);
            return Promise.reject(error);
          });
        }
        triggerSubscriptions(afterCallbackList, ret);
        return ret;
      };
    }
    const _hmrPayload = /* @__PURE__ */ vue.markRaw({
      actions: {},
      getters: {},
      state: [],
      hotState
    });
    const partialStore = {
      _p: pinia,
      // _s: scope,
      $id,
      $onAction: addSubscription.bind(null, actionSubscriptions),
      $patch,
      $reset,
      $subscribe(callback, options2 = {}) {
        const removeSubscription = addSubscription(subscriptions, callback, options2.detached, () => stopWatcher());
        const stopWatcher = scope.run(() => vue.watch(() => pinia.state.value[$id], (state) => {
          if (options2.flush === "sync" ? isSyncListening : isListening) {
            callback({
              storeId: $id,
              type: MutationType.direct,
              events: debuggerEvents
            }, state);
          }
        }, assign({}, $subscribeOptions, options2)));
        return removeSubscription;
      },
      $dispose
    };
    const store = vue.reactive(assign(
      {
        _hmrPayload,
        _customProperties: vue.markRaw(/* @__PURE__ */ new Set())
        // devtools custom properties
      },
      partialStore
      // must be added later
      // setupStore
    ));
    pinia._s.set($id, store);
    const runWithContext = pinia._a && pinia._a.runWithContext || fallbackRunWithContext;
    const setupStore = runWithContext(() => pinia._e.run(() => (scope = vue.effectScope()).run(setup)));
    for (const key in setupStore) {
      const prop = setupStore[key];
      if (vue.isRef(prop) && !isComputed(prop) || vue.isReactive(prop)) {
        if (hot) {
          set(hotState.value, key, vue.toRef(setupStore, key));
        } else if (!isOptionsStore) {
          if (initialState && shouldHydrate(prop)) {
            if (vue.isRef(prop)) {
              prop.value = initialState[key];
            } else {
              mergeReactiveObjects(prop, initialState[key]);
            }
          }
          {
            pinia.state.value[$id][key] = prop;
          }
        }
        {
          _hmrPayload.state.push(key);
        }
      } else if (typeof prop === "function") {
        const actionValue = hot ? prop : wrapAction(key, prop);
        {
          setupStore[key] = actionValue;
        }
        {
          _hmrPayload.actions[key] = prop;
        }
        optionsForPlugin.actions[key] = prop;
      } else {
        if (isComputed(prop)) {
          _hmrPayload.getters[key] = isOptionsStore ? (
            // @ts-expect-error
            options.getters[key]
          ) : prop;
          if (IS_CLIENT) {
            const getters = setupStore._getters || // @ts-expect-error: same
            (setupStore._getters = vue.markRaw([]));
            getters.push(key);
          }
        }
      }
    }
    {
      assign(store, setupStore);
      assign(vue.toRaw(store), setupStore);
    }
    Object.defineProperty(store, "$state", {
      get: () => hot ? hotState.value : pinia.state.value[$id],
      set: (state) => {
        if (hot) {
          throw new Error("cannot set hotState");
        }
        $patch(($state) => {
          assign($state, state);
        });
      }
    });
    {
      store._hotUpdate = vue.markRaw((newStore) => {
        store._hotUpdating = true;
        newStore._hmrPayload.state.forEach((stateKey) => {
          if (stateKey in store.$state) {
            const newStateTarget = newStore.$state[stateKey];
            const oldStateSource = store.$state[stateKey];
            if (typeof newStateTarget === "object" && isPlainObject(newStateTarget) && isPlainObject(oldStateSource)) {
              patchObject(newStateTarget, oldStateSource);
            } else {
              newStore.$state[stateKey] = oldStateSource;
            }
          }
          set(store, stateKey, vue.toRef(newStore.$state, stateKey));
        });
        Object.keys(store.$state).forEach((stateKey) => {
          if (!(stateKey in newStore.$state)) {
            del(store, stateKey);
          }
        });
        isListening = false;
        isSyncListening = false;
        pinia.state.value[$id] = vue.toRef(newStore._hmrPayload, "hotState");
        isSyncListening = true;
        vue.nextTick().then(() => {
          isListening = true;
        });
        for (const actionName in newStore._hmrPayload.actions) {
          const action = newStore[actionName];
          set(store, actionName, wrapAction(actionName, action));
        }
        for (const getterName in newStore._hmrPayload.getters) {
          const getter = newStore._hmrPayload.getters[getterName];
          const getterValue = isOptionsStore ? (
            // special handling of options api
            vue.computed(() => {
              setActivePinia(pinia);
              return getter.call(store, store);
            })
          ) : getter;
          set(store, getterName, getterValue);
        }
        Object.keys(store._hmrPayload.getters).forEach((key) => {
          if (!(key in newStore._hmrPayload.getters)) {
            del(store, key);
          }
        });
        Object.keys(store._hmrPayload.actions).forEach((key) => {
          if (!(key in newStore._hmrPayload.actions)) {
            del(store, key);
          }
        });
        store._hmrPayload = newStore._hmrPayload;
        store._getters = newStore._getters;
        store._hotUpdating = false;
      });
    }
    if (USE_DEVTOOLS) {
      const nonEnumerable = {
        writable: true,
        configurable: true,
        // avoid warning on devtools trying to display this property
        enumerable: false
      };
      ["_p", "_hmrPayload", "_getters", "_customProperties"].forEach((p) => {
        Object.defineProperty(store, p, assign({ value: store[p] }, nonEnumerable));
      });
    }
    pinia._p.forEach((extender) => {
      if (USE_DEVTOOLS) {
        const extensions = scope.run(() => extender({
          store,
          app: pinia._a,
          pinia,
          options: optionsForPlugin
        }));
        Object.keys(extensions || {}).forEach((key) => store._customProperties.add(key));
        assign(store, extensions);
      } else {
        assign(store, scope.run(() => extender({
          store,
          app: pinia._a,
          pinia,
          options: optionsForPlugin
        })));
      }
    });
    if (store.$state && typeof store.$state === "object" && typeof store.$state.constructor === "function" && !store.$state.constructor.toString().includes("[native code]")) {
      console.warn(`[🍍]: The "state" must be a plain object. It cannot be
	state: () => new MyClass()
Found in store "${store.$id}".`);
    }
    if (initialState && isOptionsStore && options.hydrate) {
      options.hydrate(store.$state, initialState);
    }
    isListening = true;
    isSyncListening = true;
    return store;
  }
  function defineStore(idOrOptions, setup, setupOptions) {
    let id;
    let options;
    const isSetupStore = typeof setup === "function";
    if (typeof idOrOptions === "string") {
      id = idOrOptions;
      options = isSetupStore ? setupOptions : setup;
    } else {
      options = idOrOptions;
      id = idOrOptions.id;
      if (typeof id !== "string") {
        throw new Error(`[🍍]: "defineStore()" must be passed a store id as its first argument.`);
      }
    }
    function useStore(pinia, hot) {
      const hasContext = vue.hasInjectionContext();
      pinia = // in test mode, ignore the argument provided as we can always retrieve a
      // pinia instance with getActivePinia()
      pinia || (hasContext ? vue.inject(piniaSymbol, null) : null);
      if (pinia)
        setActivePinia(pinia);
      if (!activePinia) {
        throw new Error(`[🍍]: "getActivePinia()" was called but there was no active Pinia. Are you trying to use a store before calling "app.use(pinia)"?
See https://pinia.vuejs.org/core-concepts/outside-component-usage.html for help.
This will fail in production.`);
      }
      pinia = activePinia;
      if (!pinia._s.has(id)) {
        if (isSetupStore) {
          createSetupStore(id, setup, options, pinia);
        } else {
          createOptionsStore(id, options, pinia);
        }
        {
          useStore._pinia = pinia;
        }
      }
      const store = pinia._s.get(id);
      if (hot) {
        const hotId = "__hot:" + id;
        const newStore = isSetupStore ? createSetupStore(hotId, setup, options, pinia, true) : createOptionsStore(hotId, assign({}, options), pinia, true);
        hot._hotUpdate(newStore);
        delete pinia.state.value[hotId];
        pinia._s.delete(hotId);
      }
      if (IS_CLIENT) {
        const currentInstance = vue.getCurrentInstance();
        if (currentInstance && currentInstance.proxy && // avoid adding stores that are just built for hot module replacement
        !hot) {
          const vm = currentInstance.proxy;
          const cache = "_pStores" in vm ? vm._pStores : vm._pStores = {};
          cache[id] = store;
        }
      }
      return store;
    }
    useStore.$id = id;
    return useStore;
  }
  const useAccountStore = defineStore("account", {
    state: () => {
      const savedAccounts = uni.getStorageSync("accounts") || [];
      const savedCategories = uni.getStorageSync("categories") || [
        { id: 1, name: "餐饮", icon: "🍚", color: "#FF9800" },
        { id: 2, name: "交通", icon: "🚗", color: "#2196F3" },
        { id: 3, name: "购物", icon: "🛒", color: "#E91E63" },
        { id: 4, name: "娱乐", icon: "🎮", color: "#9C27B0" },
        { id: 5, name: "居家", icon: "🏠", color: "#4CAF50" }
      ];
      return {
        accounts: savedAccounts,
        categories: savedCategories,
        budget: uni.getStorageSync("budget") || 0,
        // 添加预算
        tags: uni.getStorageSync("tags") || []
        // 添加标签功能
      };
    },
    actions: {
      addAccount(account) {
        if (account.tags && !Array.isArray(account.tags)) {
          account.tags = [account.tags];
        }
        const newAccount = {
          id: Date.now(),
          ...account,
          createTime: /* @__PURE__ */ new Date(),
          tags: account.tags || []
        };
        this.accounts.push(newAccount);
        this.saveAccounts();
      },
      updateAccount(id, updates) {
        const index = this.accounts.findIndex((item) => item.id === id);
        if (index !== -1) {
          this.accounts[index] = {
            ...this.accounts[index],
            ...updates,
            updateTime: /* @__PURE__ */ new Date()
          };
          this.saveAccounts();
        }
      },
      deleteAccount(id) {
        const index = this.accounts.findIndex((item) => item.id === id);
        if (index !== -1) {
          this.accounts.splice(index, 1);
          this.saveAccounts();
        }
      },
      // 添加标签
      addTag(tag) {
        if (!this.tags.includes(tag)) {
          this.tags.push(tag);
          this.saveTags();
        }
      },
      // 删除标签
      deleteTag(tag) {
        const index = this.tags.indexOf(tag);
        if (index !== -1) {
          this.tags.splice(index, 1);
          this.saveTags();
          this.accounts.forEach((account) => {
            const tagIndex = account.tags.indexOf(tag);
            if (tagIndex !== -1) {
              account.tags.splice(tagIndex, 1);
            }
          });
          this.saveAccounts();
        }
      },
      // 设置预算
      setBudget(amount) {
        this.budget = Number(amount);
        uni.setStorageSync("budget", this.budget);
      },
      // 保存数据到本地存储
      saveAccounts() {
        uni.setStorageSync("accounts", this.accounts);
      },
      saveCategories() {
        uni.setStorageSync("categories", this.categories);
      },
      saveTags() {
        uni.setStorageSync("tags", this.tags);
      },
      // 添加编辑账单方法
      editAccount(id, updates) {
        const index = this.accounts.findIndex((item) => item.id === id);
        if (index !== -1) {
          this.accounts[index] = {
            ...this.accounts[index],
            ...updates,
            updateTime: /* @__PURE__ */ new Date()
          };
          this.saveAccounts();
        }
      },
      // 添加批量删除方法
      deleteAccounts(ids) {
        this.accounts = this.accounts.filter((item) => !ids.includes(item.id));
        this.saveAccounts();
      }
    },
    getters: {
      // 获取当月支出
      currentMonthExpense: (state) => {
        const now2 = /* @__PURE__ */ new Date();
        return state.accounts.filter((item) => {
          const itemDate = new Date(item.createTime);
          return itemDate.getMonth() === now2.getMonth() && itemDate.getFullYear() === now2.getFullYear();
        }).reduce((total, item) => total + Number(item.amount), 0);
      },
      // 计算预算使用情况
      budgetUsage: (state) => {
        if (!state.budget)
          return 0;
        return Math.min(state.currentMonthExpense / state.budget * 100, 100);
      },
      // 按标签分组的支出
      expenseByTags: (state) => {
        const result = {};
        state.accounts.forEach((account) => {
          account.tags.forEach((tag) => {
            if (!result[tag]) {
              result[tag] = 0;
            }
            result[tag] += Number(account.amount);
          });
        });
        return result;
      }
    }
  });
  function getDayjs() {
    const app = getApp();
    return app.$vm.$.appContext.config.globalProperties.$dayjs;
  }
  function formatDate(dateStr) {
    const dayjs2 = getDayjs();
    const date = dayjs2(dateStr);
    const today = dayjs2().format("YYYY-MM-DD");
    const yesterday = dayjs2().subtract(1, "day").format("YYYY-MM-DD");
    if (dateStr === today)
      return "今天";
    if (dateStr === yesterday)
      return "昨天";
    return date.format("M月D日");
  }
  function formatTime(time) {
    const dayjs2 = getDayjs();
    return dayjs2(time).format("HH:mm");
  }
  function formatDateTime$1(time) {
    const dayjs2 = getDayjs();
    return dayjs2(time).format("YYYY-MM-DD HH:mm");
  }
  function getCurrentMonth() {
    const dayjs2 = getDayjs();
    return dayjs2().month() + 1;
  }
  function getCurrentYear() {
    const dayjs2 = getDayjs();
    return dayjs2().year();
  }
  function getLastMonth() {
    const dayjs2 = getDayjs();
    const lastMonth = dayjs2().subtract(1, "month");
    return {
      year: lastMonth.year(),
      month: lastMonth.month() + 1
    };
  }
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _sfc_main$8 = {
    __name: "index",
    setup(__props, { expose: __expose }) {
      __expose();
      const accountStore = useAccountStore();
      const currentMonth = vue.ref(getCurrentMonth());
      const currentYear = vue.ref(getCurrentYear());
      const monthlyBills = vue.computed(() => {
        return accountStore.accounts.filter((item) => {
          const date = new Date(item.createTime);
          return date.getMonth() + 1 === currentMonth.value && date.getFullYear() === currentYear.value;
        });
      });
      const monthlyExpense = vue.computed(() => {
        return monthlyBills.value.reduce((total, item) => total + Number(item.amount), 0).toFixed(2);
      });
      const budgetProgress = vue.computed(() => {
        if (!accountStore.budget)
          return 0;
        return Math.min(monthlyExpense.value / accountStore.budget * 100, 100);
      });
      const recentBills = vue.computed(() => {
        return [...accountStore.accounts].sort((a, b) => new Date(b.createTime) - new Date(a.createTime)).slice(0, 5);
      });
      const categoryStats = vue.computed(() => {
        const stats = {};
        monthlyBills.value.forEach((bill) => {
          if (!stats[bill.category]) {
            stats[bill.category] = {
              amount: 0,
              count: 0,
              color: getCategoryColor(bill.category),
              icon: getCategoryIcon(bill.category)
            };
          }
          stats[bill.category].amount += Number(bill.amount);
          stats[bill.category].count += 1;
        });
        return Object.entries(stats).map(([category, data]) => ({
          category,
          ...data,
          percentage: (data.amount / monthlyExpense.value * 100).toFixed(1)
        })).sort((a, b) => b.amount - a.amount);
      });
      const dailyAverage = vue.computed(() => {
        if (recordDays.value === 0)
          return "0.00";
        return (Number(monthlyExpense.value) / recordDays.value).toFixed(2);
      });
      const maxExpense = vue.computed(() => {
        const amounts = monthlyBills.value.map((item) => Number(item.amount));
        return Math.max(...amounts, 0).toFixed(2);
      });
      const recordDays = vue.computed(() => {
        const days = new Set(
          monthlyBills.value.map((item) => {
            const date = new Date(item.createTime);
            return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
          })
        );
        return days.size;
      });
      function getCategoryIcon(category) {
        const icons = {
          "餐饮": "🍚",
          "交通": "🚗",
          "购物": "🛒",
          "娱乐": "🎮",
          "居家": "🏠"
        };
        return icons[category] || "💰";
      }
      function getCategoryColor(category) {
        const colors = {
          "餐饮": "#FF9800",
          "交通": "#2196F3",
          "购物": "#E91E63",
          "娱乐": "#9C27B0",
          "居家": "#4CAF50"
        };
        return colors[category] || "#999999";
      }
      function formatBillTime(time) {
        return formatTime(time);
      }
      function formatBillDate(date) {
        return formatDate(date);
      }
      function addBill() {
        uni.navigateTo({
          url: "/pages/add/add"
        });
      }
      function navigateToList() {
        uni.navigateTo({ url: "/pages/list/list" });
      }
      function showBillDetail(item) {
        uni.showModal({
          title: item.category,
          content: `金额：¥${item.amount}
备注：${item.note}
时间：${formatDateTime(item.createTime)}`,
          showCancel: false
        });
      }
      const __returned__ = { accountStore, currentMonth, currentYear, monthlyBills, monthlyExpense, budgetProgress, recentBills, categoryStats, dailyAverage, maxExpense, recordDays, getCategoryIcon, getCategoryColor, formatBillTime, formatBillDate, addBill, navigateToList, showBillDetail, ref: vue.ref, computed: vue.computed, onMounted: vue.onMounted, get useAccountStore() {
        return useAccountStore;
      }, get formatDate() {
        return formatDate;
      }, get formatTime() {
        return formatTime;
      }, get getCurrentMonth() {
        return getCurrentMonth;
      }, get getCurrentYear() {
        return getCurrentYear;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$7(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createCommentVNode(" 顶部统计卡片 "),
      vue.createElementVNode("view", { class: "statistics-card" }, [
        vue.createElementVNode("view", { class: "month-overview" }, [
          vue.createElementVNode(
            "text",
            { class: "month" },
            vue.toDisplayString($setup.currentMonth) + "月账单",
            1
            /* TEXT */
          ),
          vue.createElementVNode(
            "text",
            { class: "total-amount" },
            "¥" + vue.toDisplayString($setup.monthlyExpense),
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("view", { class: "statistics-grid" }, [
          vue.createElementVNode("view", { class: "grid-item" }, [
            vue.createElementVNode("text", { class: "label" }, "日均支出"),
            vue.createElementVNode(
              "text",
              { class: "value" },
              "¥" + vue.toDisplayString($setup.dailyAverage),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "grid-item" }, [
            vue.createElementVNode("text", { class: "label" }, "最大支出"),
            vue.createElementVNode(
              "text",
              { class: "value" },
              "¥" + vue.toDisplayString($setup.maxExpense),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "grid-item" }, [
            vue.createElementVNode("text", { class: "label" }, "记账天数"),
            vue.createElementVNode(
              "text",
              { class: "value" },
              vue.toDisplayString($setup.recordDays) + "天",
              1
              /* TEXT */
            )
          ])
        ])
      ]),
      vue.createCommentVNode(" 分类统计 "),
      vue.createElementVNode("view", { class: "category-stats" }, [
        vue.createElementVNode("view", { class: "section-title" }, "支出构成"),
        vue.createElementVNode("view", { class: "category-list" }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.categoryStats, (category) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: category.name,
                class: "category-item"
              }, [
                vue.createElementVNode("view", { class: "category-info" }, [
                  vue.createElementVNode(
                    "view",
                    {
                      class: "category-icon",
                      style: vue.normalizeStyle({ backgroundColor: category.color })
                    },
                    vue.toDisplayString(category.icon),
                    5
                    /* TEXT, STYLE */
                  ),
                  vue.createElementVNode("view", { class: "category-detail" }, [
                    vue.createElementVNode(
                      "text",
                      { class: "name" },
                      vue.toDisplayString(category.name),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode(
                      "text",
                      { class: "amount" },
                      "¥" + vue.toDisplayString(category.amount),
                      1
                      /* TEXT */
                    )
                  ])
                ]),
                vue.createElementVNode(
                  "text",
                  { class: "percentage" },
                  vue.toDisplayString(category.percentage) + "%",
                  1
                  /* TEXT */
                )
              ]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ])
      ]),
      vue.createCommentVNode(" 最近账单 "),
      vue.createElementVNode("view", { class: "recent-bills" }, [
        vue.createElementVNode("view", { class: "section-title" }, [
          vue.createElementVNode("text", null, "最近账单"),
          vue.createElementVNode("text", {
            class: "more",
            onClick: $setup.navigateToList
          }, "查看更多")
        ]),
        vue.createElementVNode("view", { class: "bill-list" }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.recentBills, (item) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: item.id,
                class: "bill-item",
                onClick: ($event) => $setup.showBillDetail(item)
              }, [
                vue.createElementVNode("view", { class: "left" }, [
                  vue.createElementVNode(
                    "view",
                    {
                      class: "category-icon",
                      style: vue.normalizeStyle({ backgroundColor: $setup.getCategoryColor(item.category) })
                    },
                    vue.toDisplayString($setup.getCategoryIcon(item.category)),
                    5
                    /* TEXT, STYLE */
                  ),
                  vue.createElementVNode("view", { class: "bill-detail" }, [
                    vue.createElementVNode(
                      "text",
                      { class: "category" },
                      vue.toDisplayString(item.category),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode(
                      "text",
                      { class: "note" },
                      vue.toDisplayString(item.note),
                      1
                      /* TEXT */
                    )
                  ])
                ]),
                vue.createElementVNode("view", { class: "right" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "amount" },
                    "-" + vue.toDisplayString(item.amount),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "text",
                    { class: "time" },
                    vue.toDisplayString($setup.formatBillTime(item.createTime)),
                    1
                    /* TEXT */
                  )
                ])
              ], 8, ["onClick"]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ])
      ]),
      vue.createCommentVNode(" 添加按钮 "),
      vue.createElementVNode("view", { class: "action-buttons" }, [
        vue.createElementVNode("view", {
          class: "add-btn",
          onClick: $setup.addBill
        }, [
          vue.createElementVNode("text", { class: "icon" }, "+"),
          vue.createElementVNode("text", null, "记一笔")
        ])
      ])
    ]);
  }
  const PagesIndexIndex = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["render", _sfc_render$7], ["__scopeId", "data-v-1cf27b2a"], ["__file", "D:/HBuilderProjects/ztbook/pages/index/index.vue"]]);
  function formatAppLog(type, filename, ...args) {
    if (uni.__log__) {
      uni.__log__(type, filename, ...args);
    } else {
      console[type].apply(console, [...args, filename]);
    }
  }
  function resolveEasycom(component, easycom) {
    return typeof component === "string" ? easycom : component;
  }
  class MPAnimation {
    constructor(options, _this) {
      this.options = options;
      this.animation = uni.createAnimation({
        ...options
      });
      this.currentStepAnimates = {};
      this.next = 0;
      this.$ = _this;
    }
    _nvuePushAnimates(type, args) {
      let aniObj = this.currentStepAnimates[this.next];
      let styles = {};
      if (!aniObj) {
        styles = {
          styles: {},
          config: {}
        };
      } else {
        styles = aniObj;
      }
      if (animateTypes1.includes(type)) {
        if (!styles.styles.transform) {
          styles.styles.transform = "";
        }
        let unit = "";
        if (type === "rotate") {
          unit = "deg";
        }
        styles.styles.transform += `${type}(${args + unit}) `;
      } else {
        styles.styles[type] = `${args}`;
      }
      this.currentStepAnimates[this.next] = styles;
    }
    _animateRun(styles = {}, config = {}) {
      let ref = this.$.$refs["ani"].ref;
      if (!ref)
        return;
      return new Promise((resolve, reject) => {
        nvueAnimation.transition(ref, {
          styles,
          ...config
        }, (res) => {
          resolve();
        });
      });
    }
    _nvueNextAnimate(animates, step = 0, fn) {
      let obj = animates[step];
      if (obj) {
        let {
          styles,
          config
        } = obj;
        this._animateRun(styles, config).then(() => {
          step += 1;
          this._nvueNextAnimate(animates, step, fn);
        });
      } else {
        this.currentStepAnimates = {};
        typeof fn === "function" && fn();
        this.isEnd = true;
      }
    }
    step(config = {}) {
      this.animation.step(config);
      return this;
    }
    run(fn) {
      this.$.animationData = this.animation.export();
      this.$.timer = setTimeout(() => {
        typeof fn === "function" && fn();
      }, this.$.durationTime);
    }
  }
  const animateTypes1 = [
    "matrix",
    "matrix3d",
    "rotate",
    "rotate3d",
    "rotateX",
    "rotateY",
    "rotateZ",
    "scale",
    "scale3d",
    "scaleX",
    "scaleY",
    "scaleZ",
    "skew",
    "skewX",
    "skewY",
    "translate",
    "translate3d",
    "translateX",
    "translateY",
    "translateZ"
  ];
  const animateTypes2 = ["opacity", "backgroundColor"];
  const animateTypes3 = ["width", "height", "left", "right", "top", "bottom"];
  animateTypes1.concat(animateTypes2, animateTypes3).forEach((type) => {
    MPAnimation.prototype[type] = function(...args) {
      this.animation[type](...args);
      return this;
    };
  });
  function createAnimation(option, _this) {
    if (!_this)
      return;
    clearTimeout(_this.timer);
    return new MPAnimation(option, _this);
  }
  const _sfc_main$7 = {
    name: "uniTransition",
    emits: ["click", "change"],
    props: {
      show: {
        type: Boolean,
        default: false
      },
      modeClass: {
        type: [Array, String],
        default() {
          return "fade";
        }
      },
      duration: {
        type: Number,
        default: 300
      },
      styles: {
        type: Object,
        default() {
          return {};
        }
      },
      customClass: {
        type: String,
        default: ""
      },
      onceRender: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
        isShow: false,
        transform: "",
        opacity: 1,
        animationData: {},
        durationTime: 300,
        config: {}
      };
    },
    watch: {
      show: {
        handler(newVal) {
          if (newVal) {
            this.open();
          } else {
            if (this.isShow) {
              this.close();
            }
          }
        },
        immediate: true
      }
    },
    computed: {
      // 生成样式数据
      stylesObject() {
        let styles = {
          ...this.styles,
          "transition-duration": this.duration / 1e3 + "s"
        };
        let transform = "";
        for (let i in styles) {
          let line = this.toLine(i);
          transform += line + ":" + styles[i] + ";";
        }
        return transform;
      },
      // 初始化动画条件
      transformStyles() {
        return "transform:" + this.transform + ";opacity:" + this.opacity + ";" + this.stylesObject;
      }
    },
    created() {
      this.config = {
        duration: this.duration,
        timingFunction: "ease",
        transformOrigin: "50% 50%",
        delay: 0
      };
      this.durationTime = this.duration;
    },
    methods: {
      /**
       *  ref 触发 初始化动画
       */
      init(obj = {}) {
        if (obj.duration) {
          this.durationTime = obj.duration;
        }
        this.animation = createAnimation(Object.assign(this.config, obj), this);
      },
      /**
       * 点击组件触发回调
       */
      onClick() {
        this.$emit("click", {
          detail: this.isShow
        });
      },
      /**
       * ref 触发 动画分组
       * @param {Object} obj
       */
      step(obj, config = {}) {
        if (!this.animation)
          return;
        for (let i in obj) {
          try {
            if (typeof obj[i] === "object") {
              this.animation[i](...obj[i]);
            } else {
              this.animation[i](obj[i]);
            }
          } catch (e) {
            formatAppLog("error", "at node_modules/@dcloudio/uni-ui/lib/uni-transition/uni-transition.vue:148", `方法 ${i} 不存在`);
          }
        }
        this.animation.step(config);
        return this;
      },
      /**
       *  ref 触发 执行动画
       */
      run(fn) {
        if (!this.animation)
          return;
        this.animation.run(fn);
      },
      // 开始过度动画
      open() {
        clearTimeout(this.timer);
        this.transform = "";
        this.isShow = true;
        let { opacity, transform } = this.styleInit(false);
        if (typeof opacity !== "undefined") {
          this.opacity = opacity;
        }
        this.transform = transform;
        this.$nextTick(() => {
          this.timer = setTimeout(() => {
            this.animation = createAnimation(this.config, this);
            this.tranfromInit(false).step();
            this.animation.run();
            this.$emit("change", {
              detail: this.isShow
            });
          }, 20);
        });
      },
      // 关闭过度动画
      close(type) {
        if (!this.animation)
          return;
        this.tranfromInit(true).step().run(() => {
          this.isShow = false;
          this.animationData = null;
          this.animation = null;
          let { opacity, transform } = this.styleInit(false);
          this.opacity = opacity || 1;
          this.transform = transform;
          this.$emit("change", {
            detail: this.isShow
          });
        });
      },
      // 处理动画开始前的默认样式
      styleInit(type) {
        let styles = {
          transform: ""
        };
        let buildStyle = (type2, mode) => {
          if (mode === "fade") {
            styles.opacity = this.animationType(type2)[mode];
          } else {
            styles.transform += this.animationType(type2)[mode] + " ";
          }
        };
        if (typeof this.modeClass === "string") {
          buildStyle(type, this.modeClass);
        } else {
          this.modeClass.forEach((mode) => {
            buildStyle(type, mode);
          });
        }
        return styles;
      },
      // 处理内置组合动画
      tranfromInit(type) {
        let buildTranfrom = (type2, mode) => {
          let aniNum = null;
          if (mode === "fade") {
            aniNum = type2 ? 0 : 1;
          } else {
            aniNum = type2 ? "-100%" : "0";
            if (mode === "zoom-in") {
              aniNum = type2 ? 0.8 : 1;
            }
            if (mode === "zoom-out") {
              aniNum = type2 ? 1.2 : 1;
            }
            if (mode === "slide-right") {
              aniNum = type2 ? "100%" : "0";
            }
            if (mode === "slide-bottom") {
              aniNum = type2 ? "100%" : "0";
            }
          }
          this.animation[this.animationMode()[mode]](aniNum);
        };
        if (typeof this.modeClass === "string") {
          buildTranfrom(type, this.modeClass);
        } else {
          this.modeClass.forEach((mode) => {
            buildTranfrom(type, mode);
          });
        }
        return this.animation;
      },
      animationType(type) {
        return {
          fade: type ? 0 : 1,
          "slide-top": `translateY(${type ? "0" : "-100%"})`,
          "slide-right": `translateX(${type ? "0" : "100%"})`,
          "slide-bottom": `translateY(${type ? "0" : "100%"})`,
          "slide-left": `translateX(${type ? "0" : "-100%"})`,
          "zoom-in": `scaleX(${type ? 1 : 0.8}) scaleY(${type ? 1 : 0.8})`,
          "zoom-out": `scaleX(${type ? 1 : 1.2}) scaleY(${type ? 1 : 1.2})`
        };
      },
      // 内置动画类型与实际动画对应字典
      animationMode() {
        return {
          fade: "opacity",
          "slide-top": "translateY",
          "slide-right": "translateX",
          "slide-bottom": "translateY",
          "slide-left": "translateX",
          "zoom-in": "scale",
          "zoom-out": "scale"
        };
      },
      // 驼峰转中横线
      toLine(name) {
        return name.replace(/([A-Z])/g, "-$1").toLowerCase();
      }
    }
  };
  function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.withDirectives((vue.openBlock(), vue.createElementBlock("view", {
      ref: "ani",
      animation: $data.animationData,
      class: vue.normalizeClass($props.customClass),
      style: vue.normalizeStyle($options.transformStyles),
      onClick: _cache[0] || (_cache[0] = (...args) => $options.onClick && $options.onClick(...args))
    }, [
      vue.renderSlot(_ctx.$slots, "default")
    ], 14, ["animation"])), [
      [vue.vShow, $data.isShow]
    ]);
  }
  const __easycom_0$1 = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["render", _sfc_render$6], ["__file", "D:/HBuilderProjects/ztbook/node_modules/@dcloudio/uni-ui/lib/uni-transition/uni-transition.vue"]]);
  const _sfc_main$6 = {
    name: "uniPopup",
    components: {},
    emits: ["change", "maskClick"],
    props: {
      // 开启动画
      animation: {
        type: Boolean,
        default: true
      },
      // 弹出层类型，可选值，top: 顶部弹出层；bottom：底部弹出层；center：全屏弹出层
      // message: 消息提示 ; dialog : 对话框
      type: {
        type: String,
        default: "center"
      },
      // maskClick
      isMaskClick: {
        type: Boolean,
        default: null
      },
      // TODO 2 个版本后废弃属性 ，使用 isMaskClick
      maskClick: {
        type: Boolean,
        default: null
      },
      backgroundColor: {
        type: String,
        default: "none"
      },
      safeArea: {
        type: Boolean,
        default: true
      },
      maskBackgroundColor: {
        type: String,
        default: "rgba(0, 0, 0, 0.4)"
      },
      borderRadius: {
        type: String
      }
    },
    watch: {
      /**
       * 监听type类型
       */
      type: {
        handler: function(type) {
          if (!this.config[type])
            return;
          this[this.config[type]](true);
        },
        immediate: true
      },
      isDesktop: {
        handler: function(newVal) {
          if (!this.config[newVal])
            return;
          this[this.config[this.type]](true);
        },
        immediate: true
      },
      /**
       * 监听遮罩是否可点击
       * @param {Object} val
       */
      maskClick: {
        handler: function(val) {
          this.mkclick = val;
        },
        immediate: true
      },
      isMaskClick: {
        handler: function(val) {
          this.mkclick = val;
        },
        immediate: true
      },
      // H5 下禁止底部滚动
      showPopup(show) {
      }
    },
    data() {
      return {
        duration: 300,
        ani: [],
        showPopup: false,
        showTrans: false,
        popupWidth: 0,
        popupHeight: 0,
        config: {
          top: "top",
          bottom: "bottom",
          center: "center",
          left: "left",
          right: "right",
          message: "top",
          dialog: "center",
          share: "bottom"
        },
        maskClass: {
          position: "fixed",
          bottom: 0,
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: "rgba(0, 0, 0, 0.4)"
        },
        transClass: {
          backgroundColor: "transparent",
          borderRadius: this.borderRadius || "0",
          position: "fixed",
          left: 0,
          right: 0
        },
        maskShow: true,
        mkclick: true,
        popupstyle: "top"
      };
    },
    computed: {
      getStyles() {
        let res = { backgroundColor: this.bg };
        if (this.borderRadius || "0") {
          res = Object.assign(res, { borderRadius: this.borderRadius });
        }
        return res;
      },
      isDesktop() {
        return this.popupWidth >= 500 && this.popupHeight >= 500;
      },
      bg() {
        if (this.backgroundColor === "" || this.backgroundColor === "none") {
          return "transparent";
        }
        return this.backgroundColor;
      }
    },
    mounted() {
      const fixSize = () => {
        const {
          windowWidth,
          windowHeight,
          windowTop,
          safeArea,
          screenHeight,
          safeAreaInsets
        } = uni.getSystemInfoSync();
        this.popupWidth = windowWidth;
        this.popupHeight = windowHeight + (windowTop || 0);
        if (safeArea && this.safeArea) {
          this.safeAreaInsets = safeAreaInsets.bottom;
        } else {
          this.safeAreaInsets = 0;
        }
      };
      fixSize();
    },
    // TODO vue3
    unmounted() {
      this.setH5Visible();
    },
    activated() {
      this.setH5Visible(!this.showPopup);
    },
    deactivated() {
      this.setH5Visible(true);
    },
    created() {
      if (this.isMaskClick === null && this.maskClick === null) {
        this.mkclick = true;
      } else {
        this.mkclick = this.isMaskClick !== null ? this.isMaskClick : this.maskClick;
      }
      if (this.animation) {
        this.duration = 300;
      } else {
        this.duration = 0;
      }
      this.messageChild = null;
      this.clearPropagation = false;
      this.maskClass.backgroundColor = this.maskBackgroundColor;
    },
    methods: {
      setH5Visible(visible = true) {
      },
      /**
       * 公用方法，不显示遮罩层
       */
      closeMask() {
        this.maskShow = false;
      },
      /**
       * 公用方法，遮罩层禁止点击
       */
      disableMask() {
        this.mkclick = false;
      },
      // TODO nvue 取消冒泡
      clear(e) {
        e.stopPropagation();
        this.clearPropagation = true;
      },
      open(direction) {
        if (this.showPopup) {
          return;
        }
        let innerType = ["top", "center", "bottom", "left", "right", "message", "dialog", "share"];
        if (!(direction && innerType.indexOf(direction) !== -1)) {
          direction = this.type;
        }
        if (!this.config[direction]) {
          formatAppLog("error", "at node_modules/@dcloudio/uni-ui/lib/uni-popup/uni-popup.vue:310", "缺少类型：", direction);
          return;
        }
        this[this.config[direction]]();
        this.$emit("change", {
          show: true,
          type: direction
        });
      },
      close(type) {
        this.showTrans = false;
        this.$emit("change", {
          show: false,
          type: this.type
        });
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
          this.showPopup = false;
        }, 300);
      },
      // TODO 处理冒泡事件，头条的冒泡事件有问题 ，先这样兼容
      touchstart() {
        this.clearPropagation = false;
      },
      onTap() {
        if (this.clearPropagation) {
          this.clearPropagation = false;
          return;
        }
        this.$emit("maskClick");
        if (!this.mkclick)
          return;
        this.close();
      },
      /**
       * 顶部弹出样式处理
       */
      top(type) {
        this.popupstyle = this.isDesktop ? "fixforpc-top" : "top";
        this.ani = ["slide-top"];
        this.transClass = {
          position: "fixed",
          left: 0,
          right: 0,
          backgroundColor: this.bg,
          borderRadius: this.borderRadius || "0"
        };
        if (type)
          return;
        this.showPopup = true;
        this.showTrans = true;
        this.$nextTick(() => {
          this.showPoptrans();
          if (this.messageChild && this.type === "message") {
            this.messageChild.timerClose();
          }
        });
      },
      /**
       * 底部弹出样式处理
       */
      bottom(type) {
        this.popupstyle = "bottom";
        this.ani = ["slide-bottom"];
        this.transClass = {
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          paddingBottom: this.safeAreaInsets + "px",
          backgroundColor: this.bg,
          borderRadius: this.borderRadius || "0"
        };
        if (type)
          return;
        this.showPoptrans();
      },
      /**
       * 中间弹出样式处理
       */
      center(type) {
        this.popupstyle = "center";
        this.ani = ["zoom-out", "fade"];
        this.transClass = {
          position: "fixed",
          display: "flex",
          flexDirection: "column",
          bottom: 0,
          left: 0,
          right: 0,
          top: 0,
          justifyContent: "center",
          alignItems: "center",
          borderRadius: this.borderRadius || "0"
        };
        if (type)
          return;
        this.showPoptrans();
      },
      left(type) {
        this.popupstyle = "left";
        this.ani = ["slide-left"];
        this.transClass = {
          position: "fixed",
          left: 0,
          bottom: 0,
          top: 0,
          backgroundColor: this.bg,
          borderRadius: this.borderRadius || "0",
          display: "flex",
          flexDirection: "column"
        };
        if (type)
          return;
        this.showPoptrans();
      },
      right(type) {
        this.popupstyle = "right";
        this.ani = ["slide-right"];
        this.transClass = {
          position: "fixed",
          bottom: 0,
          right: 0,
          top: 0,
          backgroundColor: this.bg,
          borderRadius: this.borderRadius || "0",
          display: "flex",
          flexDirection: "column"
        };
        if (type)
          return;
        this.showPoptrans();
      },
      showPoptrans() {
        this.$nextTick(() => {
          this.showPopup = true;
          this.showTrans = true;
        });
      }
    }
  };
  function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_transition = resolveEasycom(vue.resolveDynamicComponent("uni-transition"), __easycom_0$1);
    return $data.showPopup ? (vue.openBlock(), vue.createElementBlock(
      "view",
      {
        key: 0,
        class: vue.normalizeClass(["uni-popup", [$data.popupstyle, $options.isDesktop ? "fixforpc-z-index" : ""]])
      },
      [
        vue.createElementVNode(
          "view",
          {
            onTouchstart: _cache[1] || (_cache[1] = (...args) => $options.touchstart && $options.touchstart(...args))
          },
          [
            $data.maskShow ? (vue.openBlock(), vue.createBlock(_component_uni_transition, {
              key: "1",
              name: "mask",
              "mode-class": "fade",
              styles: $data.maskClass,
              duration: $data.duration,
              show: $data.showTrans,
              onClick: $options.onTap
            }, null, 8, ["styles", "duration", "show", "onClick"])) : vue.createCommentVNode("v-if", true),
            vue.createVNode(_component_uni_transition, {
              key: "2",
              "mode-class": $data.ani,
              name: "content",
              styles: $data.transClass,
              duration: $data.duration,
              show: $data.showTrans,
              onClick: $options.onTap
            }, {
              default: vue.withCtx(() => [
                vue.createElementVNode(
                  "view",
                  {
                    class: vue.normalizeClass(["uni-popup__wrapper", [$data.popupstyle]]),
                    style: vue.normalizeStyle($options.getStyles),
                    onClick: _cache[0] || (_cache[0] = (...args) => $options.clear && $options.clear(...args))
                  },
                  [
                    vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
                  ],
                  6
                  /* CLASS, STYLE */
                )
              ]),
              _: 3
              /* FORWARDED */
            }, 8, ["mode-class", "styles", "duration", "show", "onClick"])
          ],
          32
          /* NEED_HYDRATION */
        )
      ],
      2
      /* CLASS */
    )) : vue.createCommentVNode("v-if", true);
  }
  const __easycom_1 = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["render", _sfc_render$5], ["__scopeId", "data-v-7db519c7"], ["__file", "D:/HBuilderProjects/ztbook/node_modules/@dcloudio/uni-ui/lib/uni-popup/uni-popup.vue"]]);
  const _sfc_main$5 = {
    __name: "add",
    setup(__props, { expose: __expose }) {
      __expose();
      const accountStore = useAccountStore();
      const tagPopup = vue.ref(null);
      const form = vue.ref({
        amount: "",
        category: "",
        date: formatDate(/* @__PURE__ */ new Date()),
        time: formatTime(/* @__PURE__ */ new Date()),
        note: "",
        tags: []
      });
      const editId = vue.ref(null);
      vue.onMounted(() => {
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        const options = currentPage.$page.options;
        if (options.id) {
          editId.value = options.id;
          const bill = accountStore.accounts.find((item) => item.id === options.id);
          if (bill) {
            form.value = {
              ...bill,
              date: formatDate(bill.createTime),
              time: formatTime(bill.createTime)
            };
          }
        }
      });
      const categories = vue.computed(() => accountStore.categories);
      const selectedTags = vue.computed(() => form.value.tags);
      const availableTags = vue.computed(() => {
        return accountStore.tags.filter((tag) => !form.value.tags.includes(tag));
      });
      const isValid = vue.computed(() => {
        return form.value.amount > 0 && form.value.category;
      });
      function selectCategory(category) {
        form.value.category = category.name;
      }
      function onDateChange(e) {
        form.value.date = e.detail.value;
      }
      function onTimeChange(e) {
        form.value.time = e.detail.value;
      }
      function showTagPicker() {
        tagPopup.value.open();
      }
      function closeTagPicker() {
        tagPopup.value.close();
      }
      function toggleTag(tag) {
        const index = form.value.tags.indexOf(tag);
        if (index === -1) {
          form.value.tags.push(tag);
        } else {
          form.value.tags.splice(index, 1);
        }
      }
      function removeTag(tag) {
        const index = form.value.tags.indexOf(tag);
        if (index !== -1) {
          form.value.tags.splice(index, 1);
        }
      }
      function showAddTagInput() {
        uni.showModal({
          title: "新建标签",
          editable: true,
          placeholderText: "请输入标签名称",
          success: (res) => {
            if (res.confirm && res.content) {
              accountStore.addTag(res.content);
              form.value.tags.push(res.content);
            }
          }
        });
      }
      function handleSubmit() {
        if (!isValid.value)
          return;
        const datetime = `${form.value.date} ${form.value.time}`;
        const data = {
          ...form.value,
          amount: Number(form.value.amount),
          createTime: new Date(datetime)
        };
        if (editId.value) {
          accountStore.editAccount(editId.value, data);
        } else {
          accountStore.addAccount(data);
        }
        uni.showToast({
          title: editId.value ? "修改成功" : "添加成功",
          icon: "success"
        });
        uni.navigateBack();
      }
      const __returned__ = { accountStore, tagPopup, form, editId, categories, selectedTags, availableTags, isValid, selectCategory, onDateChange, onTimeChange, showTagPicker, closeTagPicker, toggleTag, removeTag, showAddTagInput, handleSubmit, ref: vue.ref, computed: vue.computed, onMounted: vue.onMounted, get useAccountStore() {
        return useAccountStore;
      }, get formatDate() {
        return formatDate;
      }, get formatTime() {
        return formatTime;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_popup = resolveEasycom(vue.resolveDynamicComponent("uni-popup"), __easycom_1);
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createCommentVNode(" 金额输入区 "),
      vue.createElementVNode("view", { class: "amount-section" }, [
        vue.createElementVNode("text", { class: "currency" }, "¥"),
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            type: "digit",
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $setup.form.amount = $event),
            placeholder: "0.00",
            class: "amount-input",
            focus: ""
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $setup.form.amount]
        ])
      ]),
      vue.createCommentVNode(" 分类选择 "),
      vue.createElementVNode("view", { class: "category-section" }, [
        vue.createElementVNode("text", { class: "section-title" }, "选择分类"),
        vue.createElementVNode("view", { class: "category-grid" }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.categories, (item) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: item.id,
                class: vue.normalizeClass(["category-item", { active: $setup.form.category === item.name }]),
                onClick: ($event) => $setup.selectCategory(item)
              }, [
                vue.createElementVNode(
                  "view",
                  {
                    class: "icon",
                    style: vue.normalizeStyle({ backgroundColor: item.color })
                  },
                  vue.toDisplayString(item.icon),
                  5
                  /* TEXT, STYLE */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "name" },
                  vue.toDisplayString(item.name),
                  1
                  /* TEXT */
                )
              ], 10, ["onClick"]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ])
      ]),
      vue.createCommentVNode(" 详细信息 "),
      vue.createElementVNode("view", { class: "detail-section" }, [
        vue.createElementVNode("view", { class: "form-item" }, [
          vue.createElementVNode("text", { class: "label" }, "日期"),
          vue.createElementVNode("picker", {
            mode: "date",
            value: $setup.form.date,
            onChange: $setup.onDateChange,
            class: "picker"
          }, [
            vue.createElementVNode(
              "text",
              { class: "picker-text" },
              vue.toDisplayString($setup.form.date || "今天"),
              1
              /* TEXT */
            )
          ], 40, ["value"])
        ]),
        vue.createElementVNode("view", { class: "form-item" }, [
          vue.createElementVNode("text", { class: "label" }, "时间"),
          vue.createElementVNode("picker", {
            mode: "time",
            value: $setup.form.time,
            onChange: $setup.onTimeChange,
            class: "picker"
          }, [
            vue.createElementVNode(
              "text",
              { class: "picker-text" },
              vue.toDisplayString($setup.form.time || "现在"),
              1
              /* TEXT */
            )
          ], 40, ["value"])
        ]),
        vue.createElementVNode("view", { class: "form-item" }, [
          vue.createElementVNode("text", { class: "label" }, "备注"),
          vue.withDirectives(vue.createElementVNode(
            "input",
            {
              type: "text",
              "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $setup.form.note = $event),
              placeholder: "添加备注",
              class: "input"
            },
            null,
            512
            /* NEED_PATCH */
          ), [
            [vue.vModelText, $setup.form.note]
          ])
        ]),
        vue.createCommentVNode(" 标签选择 "),
        vue.createElementVNode("view", { class: "form-item" }, [
          vue.createElementVNode("text", { class: "label" }, "标签"),
          vue.createElementVNode("view", { class: "tags-wrap" }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($setup.selectedTags, (tag) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  key: tag,
                  class: "tag"
                }, [
                  vue.createTextVNode(
                    vue.toDisplayString(tag) + " ",
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("text", {
                    class: "remove",
                    onClick: ($event) => $setup.removeTag(tag)
                  }, "×", 8, ["onClick"])
                ]);
              }),
              128
              /* KEYED_FRAGMENT */
            )),
            vue.createElementVNode("view", {
              class: "add-tag",
              onClick: $setup.showTagPicker
            }, [
              vue.createElementVNode("text", { class: "plus" }, "+")
            ])
          ])
        ])
      ]),
      vue.createCommentVNode(" 保存按钮 "),
      vue.createElementVNode("view", { class: "button-group" }, [
        vue.createElementVNode("button", {
          class: "submit-btn",
          disabled: !$setup.isValid,
          onClick: $setup.handleSubmit
        }, " 保存 ", 8, ["disabled"])
      ]),
      vue.createCommentVNode(" 标签选择弹窗 "),
      vue.createVNode(
        _component_uni_popup,
        {
          ref: "tagPopup",
          type: "bottom"
        },
        {
          default: vue.withCtx(() => [
            vue.createElementVNode("view", { class: "tag-picker" }, [
              vue.createElementVNode("view", { class: "picker-header" }, [
                vue.createElementVNode("text", { class: "title" }, "选择标签"),
                vue.createElementVNode("text", {
                  class: "close",
                  onClick: $setup.closeTagPicker
                }, "×")
              ]),
              vue.createElementVNode("view", { class: "tag-list" }, [
                (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList($setup.availableTags, (tag) => {
                    return vue.openBlock(), vue.createElementBlock("view", {
                      key: tag,
                      class: "tag-item",
                      onClick: ($event) => $setup.toggleTag(tag)
                    }, vue.toDisplayString(tag), 9, ["onClick"]);
                  }),
                  128
                  /* KEYED_FRAGMENT */
                )),
                vue.createElementVNode("view", {
                  class: "add-new-tag",
                  onClick: $setup.showAddTagInput
                }, [
                  vue.createElementVNode("text", { class: "plus" }, "+"),
                  vue.createElementVNode("text", null, "新建标签")
                ])
              ])
            ])
          ]),
          _: 1
          /* STABLE */
        },
        512
        /* NEED_PATCH */
      )
    ]);
  }
  const PagesAddAdd = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$4], ["__scopeId", "data-v-e8d2fd40"], ["__file", "D:/HBuilderProjects/ztbook/pages/add/add.vue"]]);
  const _sfc_main$4 = {
    __name: "list",
    setup(__props, { expose: __expose }) {
      __expose();
      const { proxy } = vue.getCurrentInstance();
      const accountStore = useAccountStore();
      const scrollHeight = vue.ref(0);
      const loading = vue.ref(false);
      const selectedYear = vue.ref(getCurrentYear());
      const selectedMonth = vue.ref(getCurrentMonth());
      const actionPopup = vue.ref(null);
      const currentBill = vue.ref(null);
      const slideOffset = vue.ref(0);
      let startX = 0;
      const safeAreaBottom = vue.ref(0);
      const statusBarHeight = vue.ref(0);
      vue.onMounted(() => {
        uni.getSystemInfo({
          success: (res) => {
            var _a;
            statusBarHeight.value = res.statusBarHeight;
            safeAreaBottom.value = ((_a = res.safeAreaInsets) == null ? void 0 : _a.bottom) || 0;
          }
        });
      });
      const monthlyBills = vue.computed(() => {
        return accountStore.accounts.filter((item) => {
          const billDate = proxy.$dayjs(item.createTime);
          return billDate.year() === selectedYear.value && billDate.month() === selectedMonth.value - 1;
        });
      });
      const monthTotal = vue.computed(() => {
        return monthlyBills.value.reduce((total, item) => total + Number(item.amount), 0).toFixed(2);
      });
      const groupedBills = vue.computed(() => {
        const groups = {};
        monthlyBills.value.forEach((bill) => {
          const date = proxy.$dayjs(bill.createTime).format("YYYY-MM-DD");
          if (!groups[date]) {
            groups[date] = [];
          }
          groups[date].push(bill);
        });
        return Object.fromEntries(
          Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
        );
      });
      const hasData = vue.computed(() => Object.keys(groupedBills.value).length > 0);
      function getDayTotal(bills) {
        return bills.reduce((total, item) => total + Number(item.amount), 0).toFixed(2);
      }
      function showMonthPicker() {
        uni.showActionSheet({
          itemList: ["本月", "上月", "更早"],
          success: (res) => {
            switch (res.tapIndex) {
              case 0:
                selectedMonth.value = proxy.$dayjs().month() + 1;
                selectedYear.value = proxy.$dayjs().year();
                break;
              case 1:
                const lastMonth = proxy.$dayjs().subtract(1, "month");
                selectedMonth.value = lastMonth.month() + 1;
                selectedYear.value = lastMonth.year();
                break;
            }
          }
        });
      }
      function showBillDetail(item) {
        uni.showModal({
          title: item.category,
          content: `金额：¥${item.amount}
备注：${item.note || "无备注"}
时间：${proxy.$dayjs(item.createTime).format("YYYY-MM-DD HH:mm")}`,
          showCancel: false
        });
      }
      function showActions(item) {
        currentBill.value = item;
        actionPopup.value.open();
      }
      function closeActions() {
        actionPopup.value.close();
        currentBill.value = null;
      }
      function editBill() {
        if (currentBill.value) {
          uni.navigateTo({
            url: `/pages/add/add?id=${currentBill.value.id}`
          });
          closeActions();
        }
      }
      function deleteBill() {
        if (currentBill.value) {
          uni.showModal({
            title: "提示",
            content: "确定要删除这条账单吗？",
            success: (res) => {
              if (res.confirm) {
                accountStore.deleteAccount(currentBill.value.id);
                uni.showToast({
                  title: "删除成功",
                  icon: "success"
                });
              }
              closeActions();
            }
          });
        }
      }
      function touchStart(e) {
        startX = e.touches[0].clientX;
        slideOffset.value = 0;
      }
      function touchMove(e) {
        const moveX = e.touches[0].clientX - startX;
        if (moveX < 0) {
          slideOffset.value = Math.max(moveX, -80);
        }
      }
      function touchEnd() {
        if (slideOffset.value < -40) {
          slideOffset.value = -80;
        } else {
          slideOffset.value = 0;
        }
      }
      function getCategoryIcon(category) {
        const icons = {
          "餐饮": "🍚",
          "交通": "🚗",
          "购物": "🛒",
          "娱乐": "🎮",
          "居家": "🏠"
        };
        return icons[category] || "💰";
      }
      function getCategoryColor(category) {
        const colors = {
          "餐饮": "#FF9800",
          "交通": "#2196F3",
          "购物": "#E91E63",
          "娱乐": "#9C27B0",
          "居家": "#4CAF50"
        };
        return colors[category] || "#999999";
      }
      function loadMore() {
        if (loading.value)
          return;
      }
      const __returned__ = { proxy, accountStore, scrollHeight, loading, selectedYear, selectedMonth, actionPopup, currentBill, slideOffset, get startX() {
        return startX;
      }, set startX(v) {
        startX = v;
      }, safeAreaBottom, statusBarHeight, monthlyBills, monthTotal, groupedBills, hasData, getDayTotal, showMonthPicker, showBillDetail, showActions, closeActions, editBill, deleteBill, touchStart, touchMove, touchEnd, getCategoryIcon, getCategoryColor, loadMore, ref: vue.ref, computed: vue.computed, onMounted: vue.onMounted, getCurrentInstance: vue.getCurrentInstance, get useAccountStore() {
        return useAccountStore;
      }, get formatDate() {
        return formatDate;
      }, get formatTime() {
        return formatTime;
      }, get formatDateTime() {
        return formatDateTime$1;
      }, get getCurrentMonth() {
        return getCurrentMonth;
      }, get getCurrentYear() {
        return getCurrentYear;
      }, get getLastMonth() {
        return getLastMonth;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_popup = resolveEasycom(vue.resolveDynamicComponent("uni-popup"), __easycom_1);
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createCommentVNode(" 月份选择器 "),
      vue.createElementVNode("view", { class: "month-header" }, [
        vue.createElementVNode("view", {
          class: "month-picker",
          onClick: $setup.showMonthPicker
        }, [
          vue.createElementVNode(
            "text",
            { class: "year" },
            vue.toDisplayString($setup.selectedYear) + "年",
            1
            /* TEXT */
          ),
          vue.createElementVNode(
            "text",
            { class: "month" },
            vue.toDisplayString($setup.selectedMonth) + "月",
            1
            /* TEXT */
          ),
          vue.createElementVNode("text", { class: "arrow" }, "▼")
        ]),
        vue.createElementVNode("view", { class: "total" }, [
          vue.createElementVNode("text", { class: "label" }, "支出"),
          vue.createElementVNode(
            "text",
            { class: "amount" },
            "¥" + vue.toDisplayString($setup.monthTotal),
            1
            /* TEXT */
          )
        ])
      ]),
      vue.createCommentVNode(" 账单列表 "),
      vue.createElementVNode(
        "scroll-view",
        {
          "scroll-y": "",
          class: "bill-list",
          onScrolltolower: $setup.loadMore,
          style: vue.normalizeStyle({
            height: `calc(100vh - ${$setup.statusBarHeight}px - 44px - 52px - ${$setup.safeAreaBottom}px)`
          })
        },
        [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.groupedBills, (group, date) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: date,
                class: "date-group"
              }, [
                vue.createElementVNode("view", { class: "date-header" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "date" },
                    vue.toDisplayString($setup.formatDate(date)),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "text",
                    { class: "day-total" },
                    "支出 ¥" + vue.toDisplayString($setup.getDayTotal(group)),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode("view", { class: "bill-items" }, [
                  (vue.openBlock(true), vue.createElementBlock(
                    vue.Fragment,
                    null,
                    vue.renderList(group, (item) => {
                      return vue.openBlock(), vue.createElementBlock("view", {
                        class: "bill-item",
                        key: item.id,
                        onClick: ($event) => $setup.showBillDetail(item),
                        onLongpress: ($event) => $setup.showActions(item)
                      }, [
                        vue.createElementVNode("view", { class: "left" }, [
                          vue.createElementVNode(
                            "view",
                            {
                              class: "icon",
                              style: vue.normalizeStyle({ backgroundColor: $setup.getCategoryColor(item.category) })
                            },
                            vue.toDisplayString($setup.getCategoryIcon(item.category)),
                            5
                            /* TEXT, STYLE */
                          ),
                          vue.createElementVNode("view", { class: "detail" }, [
                            vue.createElementVNode(
                              "text",
                              { class: "category" },
                              vue.toDisplayString(item.category),
                              1
                              /* TEXT */
                            ),
                            vue.createElementVNode(
                              "text",
                              { class: "note" },
                              vue.toDisplayString(item.note || "无备注"),
                              1
                              /* TEXT */
                            )
                          ])
                        ]),
                        vue.createElementVNode("view", { class: "right" }, [
                          vue.createElementVNode(
                            "text",
                            { class: "amount" },
                            "-" + vue.toDisplayString(item.amount),
                            1
                            /* TEXT */
                          ),
                          vue.createElementVNode(
                            "text",
                            { class: "time" },
                            vue.toDisplayString($setup.formatTime(item.createTime)),
                            1
                            /* TEXT */
                          )
                        ])
                      ], 40, ["onClick", "onLongpress"]);
                    }),
                    128
                    /* KEYED_FRAGMENT */
                  ))
                ])
              ]);
            }),
            128
            /* KEYED_FRAGMENT */
          )),
          vue.createCommentVNode(" 加载状态 "),
          $setup.loading ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "loading-state"
          }, [
            vue.createElementVNode("text", null, "加载中...")
          ])) : vue.createCommentVNode("v-if", true),
          vue.createCommentVNode(" 无数据提示 "),
          !$setup.loading && !$setup.hasData ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "empty-state"
          }, [
            vue.createElementVNode("text", null, "暂无账单记录")
          ])) : vue.createCommentVNode("v-if", true)
        ],
        36
        /* STYLE, NEED_HYDRATION */
      ),
      vue.createCommentVNode(" 添加操作菜单 "),
      vue.createVNode(
        _component_uni_popup,
        {
          ref: "actionPopup",
          type: "bottom"
        },
        {
          default: vue.withCtx(() => [
            vue.createElementVNode("view", { class: "action-sheet" }, [
              vue.createElementVNode("view", {
                class: "action-item",
                onClick: $setup.editBill
              }, [
                vue.createElementVNode("text", null, "编辑")
              ]),
              vue.createElementVNode("view", {
                class: "action-item",
                onClick: $setup.deleteBill
              }, [
                vue.createElementVNode("text", null, "删除")
              ]),
              vue.createElementVNode("view", {
                class: "action-item cancel",
                onClick: $setup.closeActions
              }, [
                vue.createElementVNode("text", null, "取消")
              ])
            ])
          ]),
          _: 1
          /* STABLE */
        },
        512
        /* NEED_PATCH */
      )
    ]);
  }
  const PagesListList = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$3], ["__scopeId", "data-v-98a9e0b2"], ["__file", "D:/HBuilderProjects/ztbook/pages/list/list.vue"]]);
  var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
  function getDefaultExportFromCjs(x) {
    return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
  }
  var dayjs_min = { exports: {} };
  (function(module, exports) {
    !function(t2, e) {
      module.exports = e();
    }(commonjsGlobal, function() {
      var t2 = 1e3, e = 6e4, n = 36e5, r = "millisecond", i = "second", s = "minute", u = "hour", a = "day", o = "week", c = "month", f = "quarter", h = "year", d = "date", l = "Invalid Date", $ = /^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/, y = /\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g, M = { name: "en", weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"), months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"), ordinal: function(t3) {
        var e2 = ["th", "st", "nd", "rd"], n2 = t3 % 100;
        return "[" + t3 + (e2[(n2 - 20) % 10] || e2[n2] || e2[0]) + "]";
      } }, m = function(t3, e2, n2) {
        var r2 = String(t3);
        return !r2 || r2.length >= e2 ? t3 : "" + Array(e2 + 1 - r2.length).join(n2) + t3;
      }, v = { s: m, z: function(t3) {
        var e2 = -t3.utcOffset(), n2 = Math.abs(e2), r2 = Math.floor(n2 / 60), i2 = n2 % 60;
        return (e2 <= 0 ? "+" : "-") + m(r2, 2, "0") + ":" + m(i2, 2, "0");
      }, m: function t3(e2, n2) {
        if (e2.date() < n2.date())
          return -t3(n2, e2);
        var r2 = 12 * (n2.year() - e2.year()) + (n2.month() - e2.month()), i2 = e2.clone().add(r2, c), s2 = n2 - i2 < 0, u2 = e2.clone().add(r2 + (s2 ? -1 : 1), c);
        return +(-(r2 + (n2 - i2) / (s2 ? i2 - u2 : u2 - i2)) || 0);
      }, a: function(t3) {
        return t3 < 0 ? Math.ceil(t3) || 0 : Math.floor(t3);
      }, p: function(t3) {
        return { M: c, y: h, w: o, d: a, D: d, h: u, m: s, s: i, ms: r, Q: f }[t3] || String(t3 || "").toLowerCase().replace(/s$/, "");
      }, u: function(t3) {
        return void 0 === t3;
      } }, g = "en", D = {};
      D[g] = M;
      var p = "$isDayjsObject", S = function(t3) {
        return t3 instanceof _ || !(!t3 || !t3[p]);
      }, w = function t3(e2, n2, r2) {
        var i2;
        if (!e2)
          return g;
        if ("string" == typeof e2) {
          var s2 = e2.toLowerCase();
          D[s2] && (i2 = s2), n2 && (D[s2] = n2, i2 = s2);
          var u2 = e2.split("-");
          if (!i2 && u2.length > 1)
            return t3(u2[0]);
        } else {
          var a2 = e2.name;
          D[a2] = e2, i2 = a2;
        }
        return !r2 && i2 && (g = i2), i2 || !r2 && g;
      }, O = function(t3, e2) {
        if (S(t3))
          return t3.clone();
        var n2 = "object" == typeof e2 ? e2 : {};
        return n2.date = t3, n2.args = arguments, new _(n2);
      }, b = v;
      b.l = w, b.i = S, b.w = function(t3, e2) {
        return O(t3, { locale: e2.$L, utc: e2.$u, x: e2.$x, $offset: e2.$offset });
      };
      var _ = function() {
        function M2(t3) {
          this.$L = w(t3.locale, null, true), this.parse(t3), this.$x = this.$x || t3.x || {}, this[p] = true;
        }
        var m2 = M2.prototype;
        return m2.parse = function(t3) {
          this.$d = function(t4) {
            var e2 = t4.date, n2 = t4.utc;
            if (null === e2)
              return /* @__PURE__ */ new Date(NaN);
            if (b.u(e2))
              return /* @__PURE__ */ new Date();
            if (e2 instanceof Date)
              return new Date(e2);
            if ("string" == typeof e2 && !/Z$/i.test(e2)) {
              var r2 = e2.match($);
              if (r2) {
                var i2 = r2[2] - 1 || 0, s2 = (r2[7] || "0").substring(0, 3);
                return n2 ? new Date(Date.UTC(r2[1], i2, r2[3] || 1, r2[4] || 0, r2[5] || 0, r2[6] || 0, s2)) : new Date(r2[1], i2, r2[3] || 1, r2[4] || 0, r2[5] || 0, r2[6] || 0, s2);
              }
            }
            return new Date(e2);
          }(t3), this.init();
        }, m2.init = function() {
          var t3 = this.$d;
          this.$y = t3.getFullYear(), this.$M = t3.getMonth(), this.$D = t3.getDate(), this.$W = t3.getDay(), this.$H = t3.getHours(), this.$m = t3.getMinutes(), this.$s = t3.getSeconds(), this.$ms = t3.getMilliseconds();
        }, m2.$utils = function() {
          return b;
        }, m2.isValid = function() {
          return !(this.$d.toString() === l);
        }, m2.isSame = function(t3, e2) {
          var n2 = O(t3);
          return this.startOf(e2) <= n2 && n2 <= this.endOf(e2);
        }, m2.isAfter = function(t3, e2) {
          return O(t3) < this.startOf(e2);
        }, m2.isBefore = function(t3, e2) {
          return this.endOf(e2) < O(t3);
        }, m2.$g = function(t3, e2, n2) {
          return b.u(t3) ? this[e2] : this.set(n2, t3);
        }, m2.unix = function() {
          return Math.floor(this.valueOf() / 1e3);
        }, m2.valueOf = function() {
          return this.$d.getTime();
        }, m2.startOf = function(t3, e2) {
          var n2 = this, r2 = !!b.u(e2) || e2, f2 = b.p(t3), l2 = function(t4, e3) {
            var i2 = b.w(n2.$u ? Date.UTC(n2.$y, e3, t4) : new Date(n2.$y, e3, t4), n2);
            return r2 ? i2 : i2.endOf(a);
          }, $2 = function(t4, e3) {
            return b.w(n2.toDate()[t4].apply(n2.toDate("s"), (r2 ? [0, 0, 0, 0] : [23, 59, 59, 999]).slice(e3)), n2);
          }, y2 = this.$W, M3 = this.$M, m3 = this.$D, v2 = "set" + (this.$u ? "UTC" : "");
          switch (f2) {
            case h:
              return r2 ? l2(1, 0) : l2(31, 11);
            case c:
              return r2 ? l2(1, M3) : l2(0, M3 + 1);
            case o:
              var g2 = this.$locale().weekStart || 0, D2 = (y2 < g2 ? y2 + 7 : y2) - g2;
              return l2(r2 ? m3 - D2 : m3 + (6 - D2), M3);
            case a:
            case d:
              return $2(v2 + "Hours", 0);
            case u:
              return $2(v2 + "Minutes", 1);
            case s:
              return $2(v2 + "Seconds", 2);
            case i:
              return $2(v2 + "Milliseconds", 3);
            default:
              return this.clone();
          }
        }, m2.endOf = function(t3) {
          return this.startOf(t3, false);
        }, m2.$set = function(t3, e2) {
          var n2, o2 = b.p(t3), f2 = "set" + (this.$u ? "UTC" : ""), l2 = (n2 = {}, n2[a] = f2 + "Date", n2[d] = f2 + "Date", n2[c] = f2 + "Month", n2[h] = f2 + "FullYear", n2[u] = f2 + "Hours", n2[s] = f2 + "Minutes", n2[i] = f2 + "Seconds", n2[r] = f2 + "Milliseconds", n2)[o2], $2 = o2 === a ? this.$D + (e2 - this.$W) : e2;
          if (o2 === c || o2 === h) {
            var y2 = this.clone().set(d, 1);
            y2.$d[l2]($2), y2.init(), this.$d = y2.set(d, Math.min(this.$D, y2.daysInMonth())).$d;
          } else
            l2 && this.$d[l2]($2);
          return this.init(), this;
        }, m2.set = function(t3, e2) {
          return this.clone().$set(t3, e2);
        }, m2.get = function(t3) {
          return this[b.p(t3)]();
        }, m2.add = function(r2, f2) {
          var d2, l2 = this;
          r2 = Number(r2);
          var $2 = b.p(f2), y2 = function(t3) {
            var e2 = O(l2);
            return b.w(e2.date(e2.date() + Math.round(t3 * r2)), l2);
          };
          if ($2 === c)
            return this.set(c, this.$M + r2);
          if ($2 === h)
            return this.set(h, this.$y + r2);
          if ($2 === a)
            return y2(1);
          if ($2 === o)
            return y2(7);
          var M3 = (d2 = {}, d2[s] = e, d2[u] = n, d2[i] = t2, d2)[$2] || 1, m3 = this.$d.getTime() + r2 * M3;
          return b.w(m3, this);
        }, m2.subtract = function(t3, e2) {
          return this.add(-1 * t3, e2);
        }, m2.format = function(t3) {
          var e2 = this, n2 = this.$locale();
          if (!this.isValid())
            return n2.invalidDate || l;
          var r2 = t3 || "YYYY-MM-DDTHH:mm:ssZ", i2 = b.z(this), s2 = this.$H, u2 = this.$m, a2 = this.$M, o2 = n2.weekdays, c2 = n2.months, f2 = n2.meridiem, h2 = function(t4, n3, i3, s3) {
            return t4 && (t4[n3] || t4(e2, r2)) || i3[n3].slice(0, s3);
          }, d2 = function(t4) {
            return b.s(s2 % 12 || 12, t4, "0");
          }, $2 = f2 || function(t4, e3, n3) {
            var r3 = t4 < 12 ? "AM" : "PM";
            return n3 ? r3.toLowerCase() : r3;
          };
          return r2.replace(y, function(t4, r3) {
            return r3 || function(t5) {
              switch (t5) {
                case "YY":
                  return String(e2.$y).slice(-2);
                case "YYYY":
                  return b.s(e2.$y, 4, "0");
                case "M":
                  return a2 + 1;
                case "MM":
                  return b.s(a2 + 1, 2, "0");
                case "MMM":
                  return h2(n2.monthsShort, a2, c2, 3);
                case "MMMM":
                  return h2(c2, a2);
                case "D":
                  return e2.$D;
                case "DD":
                  return b.s(e2.$D, 2, "0");
                case "d":
                  return String(e2.$W);
                case "dd":
                  return h2(n2.weekdaysMin, e2.$W, o2, 2);
                case "ddd":
                  return h2(n2.weekdaysShort, e2.$W, o2, 3);
                case "dddd":
                  return o2[e2.$W];
                case "H":
                  return String(s2);
                case "HH":
                  return b.s(s2, 2, "0");
                case "h":
                  return d2(1);
                case "hh":
                  return d2(2);
                case "a":
                  return $2(s2, u2, true);
                case "A":
                  return $2(s2, u2, false);
                case "m":
                  return String(u2);
                case "mm":
                  return b.s(u2, 2, "0");
                case "s":
                  return String(e2.$s);
                case "ss":
                  return b.s(e2.$s, 2, "0");
                case "SSS":
                  return b.s(e2.$ms, 3, "0");
                case "Z":
                  return i2;
              }
              return null;
            }(t4) || i2.replace(":", "");
          });
        }, m2.utcOffset = function() {
          return 15 * -Math.round(this.$d.getTimezoneOffset() / 15);
        }, m2.diff = function(r2, d2, l2) {
          var $2, y2 = this, M3 = b.p(d2), m3 = O(r2), v2 = (m3.utcOffset() - this.utcOffset()) * e, g2 = this - m3, D2 = function() {
            return b.m(y2, m3);
          };
          switch (M3) {
            case h:
              $2 = D2() / 12;
              break;
            case c:
              $2 = D2();
              break;
            case f:
              $2 = D2() / 3;
              break;
            case o:
              $2 = (g2 - v2) / 6048e5;
              break;
            case a:
              $2 = (g2 - v2) / 864e5;
              break;
            case u:
              $2 = g2 / n;
              break;
            case s:
              $2 = g2 / e;
              break;
            case i:
              $2 = g2 / t2;
              break;
            default:
              $2 = g2;
          }
          return l2 ? $2 : b.a($2);
        }, m2.daysInMonth = function() {
          return this.endOf(c).$D;
        }, m2.$locale = function() {
          return D[this.$L];
        }, m2.locale = function(t3, e2) {
          if (!t3)
            return this.$L;
          var n2 = this.clone(), r2 = w(t3, e2, true);
          return r2 && (n2.$L = r2), n2;
        }, m2.clone = function() {
          return b.w(this.$d, this);
        }, m2.toDate = function() {
          return new Date(this.valueOf());
        }, m2.toJSON = function() {
          return this.isValid() ? this.toISOString() : null;
        }, m2.toISOString = function() {
          return this.$d.toISOString();
        }, m2.toString = function() {
          return this.$d.toUTCString();
        }, M2;
      }(), k = _.prototype;
      return O.prototype = k, [["$ms", r], ["$s", i], ["$m", s], ["$H", u], ["$W", a], ["$M", c], ["$y", h], ["$D", d]].forEach(function(t3) {
        k[t3[1]] = function(e2) {
          return this.$g(e2, t3[0], t3[1]);
        };
      }), O.extend = function(t3, e2) {
        return t3.$i || (t3(e2, _, O), t3.$i = true), O;
      }, O.locale = w, O.isDayjs = S, O.unix = function(t3) {
        return O(1e3 * t3);
      }, O.en = D[g], O.Ls = D, O.p = {}, O;
    });
  })(dayjs_min);
  var dayjs_minExports = dayjs_min.exports;
  const dayjs = /* @__PURE__ */ getDefaultExportFromCjs(dayjs_minExports);
  const _sfc_main$3 = {
    __name: "statistics",
    setup(__props, { expose: __expose }) {
      __expose();
      const accountStore = useAccountStore();
      const timeRanges = ["本月", "本年", "全部"];
      const currentRange = vue.ref(0);
      const filteredBills = vue.computed(() => {
        const now2 = dayjs();
        return accountStore.accounts.filter((item) => {
          const billDate = dayjs(item.createTime);
          switch (currentRange.value) {
            case 0:
              return billDate.month() === now2.month() && billDate.year() === now2.year();
            case 1:
              return billDate.year() === now2.year();
            default:
              return true;
          }
        });
      });
      const totalExpense = vue.computed(() => {
        return filteredBills.value.reduce((total, item) => total + Number(item.amount), 0).toFixed(2);
      });
      const comparePercentage = vue.computed(() => {
        const current = Number(totalExpense.value);
        if (current === 0)
          return 0;
        const now2 = dayjs();
        const previousBills = accountStore.accounts.filter((item) => {
          const billDate = dayjs(item.createTime);
          switch (currentRange.value) {
            case 0:
              return billDate.month() === now2.month() - 1 && billDate.year() === now2.year();
            case 1:
              return billDate.year() === now2.year() - 1;
            default:
              return false;
          }
        });
        const previous = previousBills.reduce((total, item) => total + Number(item.amount), 0);
        if (previous === 0)
          return 100;
        return Math.round((current - previous) / previous * 100);
      });
      const categoryStats = vue.computed(() => {
        const stats = {};
        const total = Number(totalExpense.value);
        filteredBills.value.forEach((item) => {
          if (!stats[item.category]) {
            stats[item.category] = {
              name: item.category,
              amount: 0,
              icon: getCategoryIcon(item.category),
              color: getCategoryColor(item.category)
            };
          }
          stats[item.category].amount += Number(item.amount);
        });
        return Object.values(stats).map((item) => ({
          ...item,
          amount: item.amount.toFixed(2),
          percentage: total ? Math.round(item.amount / total * 100) : 0
        })).sort((a, b) => Number(b.amount) - Number(a.amount));
      });
      const trendData = vue.computed(() => {
        const data = [];
        const now2 = dayjs();
        if (currentRange.value === 0) {
          const daysInMonth = now2.daysInMonth();
          for (let i = 1; i <= daysInMonth; i++) {
            const dayStr = `${now2.year()}-${String(now2.month() + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
            const amount = filteredBills.value.filter((item) => dayjs(item.createTime).format("YYYY-MM-DD") === dayStr).reduce((total, item) => total + Number(item.amount), 0);
            data.push({
              label: `${i}日`,
              amount,
              height: 0
            });
          }
        } else {
          for (let i = 0; i < 12; i++) {
            const monthStr = dayjs().month(i).format("M月");
            const amount = filteredBills.value.filter((item) => dayjs(item.createTime).month() === i).reduce((total, item) => total + Number(item.amount), 0);
            data.push({
              label: monthStr,
              amount,
              height: 0
            });
          }
        }
        const maxAmount = Math.max(...data.map((item) => item.amount));
        return data.map((item) => ({
          ...item,
          height: maxAmount ? Math.round(item.amount / maxAmount * 100) : 0
        }));
      });
      const mostExpenseTime = vue.computed(() => {
        const timeStats = {};
        filteredBills.value.forEach((item) => {
          const hour = dayjs(item.createTime).hour();
          const period = Math.floor(hour / 6);
          timeStats[period] = (timeStats[period] || 0) + Number(item.amount);
        });
        const maxPeriod = Object.entries(timeStats).sort((a, b) => b[1] - a[1])[0];
        return maxPeriod ? ["凌晨", "上午", "下午", "晚上"][Number(maxPeriod[0])] : "暂无数据";
      });
      const averageExpense = vue.computed(() => {
        if (filteredBills.value.length === 0)
          return "0.00";
        return (Number(totalExpense.value) / filteredBills.value.length).toFixed(2);
      });
      const maxExpense = vue.computed(() => {
        if (filteredBills.value.length === 0)
          return "0.00";
        return Math.max(...filteredBills.value.map((item) => Number(item.amount))).toFixed(2);
      });
      function selectRange(index) {
        currentRange.value = index;
      }
      function getCategoryIcon(category) {
        const icons = {
          "餐饮": "🍚",
          "交通": "🚗",
          "购物": "🛒",
          "娱乐": "🎮",
          "居家": "🏠"
        };
        return icons[category] || "💰";
      }
      function getCategoryColor(category) {
        const colors = {
          "餐饮": "#FF9800",
          "交通": "#2196F3",
          "购物": "#E91E63",
          "娱乐": "#9C27B0",
          "居家": "#4CAF50"
        };
        return colors[category] || "#999999";
      }
      const __returned__ = { accountStore, timeRanges, currentRange, filteredBills, totalExpense, comparePercentage, categoryStats, trendData, mostExpenseTime, averageExpense, maxExpense, selectRange, getCategoryIcon, getCategoryColor, ref: vue.ref, computed: vue.computed, get useAccountStore() {
        return useAccountStore;
      }, get getCurrentMonth() {
        return getCurrentMonth;
      }, get getCurrentYear() {
        return getCurrentYear;
      }, get formatDateTime() {
        return formatDateTime$1;
      }, get dayjs() {
        return dayjs;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createCommentVNode(" 时间范围选择 "),
      vue.createElementVNode("view", { class: "time-range" }, [
        (vue.openBlock(), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($setup.timeRanges, (range, index) => {
            return vue.createElementVNode("view", {
              key: index,
              class: vue.normalizeClass(["range-item", { active: $setup.currentRange === index }]),
              onClick: ($event) => $setup.selectRange(index)
            }, vue.toDisplayString(range), 11, ["onClick"]);
          }),
          64
          /* STABLE_FRAGMENT */
        ))
      ]),
      vue.createCommentVNode(" 总支出卡片 "),
      vue.createElementVNode("view", { class: "total-card" }, [
        vue.createElementVNode("view", { class: "title" }, "总支出"),
        vue.createElementVNode(
          "view",
          { class: "amount" },
          "¥" + vue.toDisplayString($setup.totalExpense),
          1
          /* TEXT */
        ),
        $setup.comparePercentage !== 0 ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "compare"
        }, [
          vue.createElementVNode(
            "text",
            null,
            "较上" + vue.toDisplayString($setup.currentRange === 0 ? "月" : "年"),
            1
            /* TEXT */
          ),
          vue.createElementVNode(
            "text",
            {
              class: vue.normalizeClass($setup.comparePercentage > 0 ? "up" : "down")
            },
            vue.toDisplayString($setup.comparePercentage > 0 ? "↑" : "↓") + " " + vue.toDisplayString(Math.abs($setup.comparePercentage)) + "% ",
            3
            /* TEXT, CLASS */
          )
        ])) : vue.createCommentVNode("v-if", true)
      ]),
      vue.createCommentVNode(" 分类统计 "),
      vue.createElementVNode("view", { class: "stats-section" }, [
        vue.createElementVNode("view", { class: "section-title" }, "支出分类"),
        vue.createElementVNode("view", { class: "category-stats" }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.categoryStats, (category) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: category.name,
                class: "category-item"
              }, [
                vue.createElementVNode("view", { class: "category-info" }, [
                  vue.createElementVNode(
                    "view",
                    {
                      class: "icon-wrap",
                      style: vue.normalizeStyle({ backgroundColor: category.color })
                    },
                    vue.toDisplayString(category.icon),
                    5
                    /* TEXT, STYLE */
                  ),
                  vue.createElementVNode("view", { class: "detail" }, [
                    vue.createElementVNode(
                      "text",
                      { class: "name" },
                      vue.toDisplayString(category.name),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode(
                      "text",
                      { class: "amount" },
                      "¥" + vue.toDisplayString(category.amount),
                      1
                      /* TEXT */
                    )
                  ])
                ]),
                vue.createElementVNode("view", { class: "progress-wrap" }, [
                  vue.createElementVNode(
                    "view",
                    {
                      class: "progress-bar",
                      style: vue.normalizeStyle({
                        width: category.percentage + "%",
                        backgroundColor: category.color
                      })
                    },
                    null,
                    4
                    /* STYLE */
                  ),
                  vue.createElementVNode(
                    "text",
                    { class: "percentage" },
                    vue.toDisplayString(category.percentage) + "%",
                    1
                    /* TEXT */
                  )
                ])
              ]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ])
      ]),
      vue.createCommentVNode(" 支出趋势 "),
      vue.createElementVNode("view", { class: "stats-section" }, [
        vue.createElementVNode("view", { class: "section-title" }, "支出趋势"),
        vue.createElementVNode("view", { class: "trend-chart" }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.trendData, (item, index) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: index,
                class: "trend-item"
              }, [
                vue.createElementVNode(
                  "view",
                  {
                    class: "bar",
                    style: vue.normalizeStyle({ height: item.height + "%" })
                  },
                  null,
                  4
                  /* STYLE */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "label" },
                  vue.toDisplayString(item.label),
                  1
                  /* TEXT */
                )
              ]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ])
      ]),
      vue.createCommentVNode(" 消费习惯分析 "),
      vue.createElementVNode("view", { class: "stats-section" }, [
        vue.createElementVNode("view", { class: "section-title" }, "消费习惯分析"),
        vue.createElementVNode("view", { class: "habits-list" }, [
          vue.createElementVNode("view", { class: "habit-item" }, [
            vue.createElementVNode("view", { class: "label" }, "最常消费时段"),
            vue.createElementVNode(
              "view",
              { class: "value" },
              vue.toDisplayString($setup.mostExpenseTime),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "habit-item" }, [
            vue.createElementVNode("view", { class: "label" }, "平均每笔支出"),
            vue.createElementVNode(
              "view",
              { class: "value" },
              "¥" + vue.toDisplayString($setup.averageExpense),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "habit-item" }, [
            vue.createElementVNode("view", { class: "label" }, "最大单笔支出"),
            vue.createElementVNode(
              "view",
              { class: "value" },
              "¥" + vue.toDisplayString($setup.maxExpense),
              1
              /* TEXT */
            )
          ])
        ])
      ])
    ]);
  }
  const PagesStatisticsStatistics = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$2], ["__scopeId", "data-v-fc23ec97"], ["__file", "D:/HBuilderProjects/ztbook/pages/statistics/statistics.vue"]]);
  const popup = {
    data() {
      return {};
    },
    created() {
      this.popup = this.getParent();
    },
    methods: {
      /**
       * 获取父元素实例
       */
      getParent(name = "uniPopup") {
        let parent = this.$parent;
        let parentName = parent.$options.name;
        while (parentName !== name) {
          parent = parent.$parent;
          if (!parent)
            return false;
          parentName = parent.$options.name;
        }
        return parent;
      }
    }
  };
  const isObject = (val) => val !== null && typeof val === "object";
  const defaultDelimiters = ["{", "}"];
  class BaseFormatter {
    constructor() {
      this._caches = /* @__PURE__ */ Object.create(null);
    }
    interpolate(message, values, delimiters = defaultDelimiters) {
      if (!values) {
        return [message];
      }
      let tokens = this._caches[message];
      if (!tokens) {
        tokens = parse(message, delimiters);
        this._caches[message] = tokens;
      }
      return compile(tokens, values);
    }
  }
  const RE_TOKEN_LIST_VALUE = /^(?:\d)+/;
  const RE_TOKEN_NAMED_VALUE = /^(?:\w)+/;
  function parse(format, [startDelimiter, endDelimiter]) {
    const tokens = [];
    let position = 0;
    let text = "";
    while (position < format.length) {
      let char = format[position++];
      if (char === startDelimiter) {
        if (text) {
          tokens.push({ type: "text", value: text });
        }
        text = "";
        let sub = "";
        char = format[position++];
        while (char !== void 0 && char !== endDelimiter) {
          sub += char;
          char = format[position++];
        }
        const isClosed = char === endDelimiter;
        const type = RE_TOKEN_LIST_VALUE.test(sub) ? "list" : isClosed && RE_TOKEN_NAMED_VALUE.test(sub) ? "named" : "unknown";
        tokens.push({ value: sub, type });
      } else {
        text += char;
      }
    }
    text && tokens.push({ type: "text", value: text });
    return tokens;
  }
  function compile(tokens, values) {
    const compiled = [];
    let index = 0;
    const mode = Array.isArray(values) ? "list" : isObject(values) ? "named" : "unknown";
    if (mode === "unknown") {
      return compiled;
    }
    while (index < tokens.length) {
      const token = tokens[index];
      switch (token.type) {
        case "text":
          compiled.push(token.value);
          break;
        case "list":
          compiled.push(values[parseInt(token.value, 10)]);
          break;
        case "named":
          if (mode === "named") {
            compiled.push(values[token.value]);
          } else {
            {
              console.warn(`Type of token '${token.type}' and format of value '${mode}' don't match!`);
            }
          }
          break;
        case "unknown":
          {
            console.warn(`Detect 'unknown' type of token!`);
          }
          break;
      }
      index++;
    }
    return compiled;
  }
  const LOCALE_ZH_HANS = "zh-Hans";
  const LOCALE_ZH_HANT = "zh-Hant";
  const LOCALE_EN = "en";
  const LOCALE_FR = "fr";
  const LOCALE_ES = "es";
  const hasOwnProperty = Object.prototype.hasOwnProperty;
  const hasOwn = (val, key) => hasOwnProperty.call(val, key);
  const defaultFormatter = new BaseFormatter();
  function include(str, parts) {
    return !!parts.find((part) => str.indexOf(part) !== -1);
  }
  function startsWith(str, parts) {
    return parts.find((part) => str.indexOf(part) === 0);
  }
  function normalizeLocale(locale, messages2) {
    if (!locale) {
      return;
    }
    locale = locale.trim().replace(/_/g, "-");
    if (messages2 && messages2[locale]) {
      return locale;
    }
    locale = locale.toLowerCase();
    if (locale === "chinese") {
      return LOCALE_ZH_HANS;
    }
    if (locale.indexOf("zh") === 0) {
      if (locale.indexOf("-hans") > -1) {
        return LOCALE_ZH_HANS;
      }
      if (locale.indexOf("-hant") > -1) {
        return LOCALE_ZH_HANT;
      }
      if (include(locale, ["-tw", "-hk", "-mo", "-cht"])) {
        return LOCALE_ZH_HANT;
      }
      return LOCALE_ZH_HANS;
    }
    let locales = [LOCALE_EN, LOCALE_FR, LOCALE_ES];
    if (messages2 && Object.keys(messages2).length > 0) {
      locales = Object.keys(messages2);
    }
    const lang = startsWith(locale, locales);
    if (lang) {
      return lang;
    }
  }
  class I18n {
    constructor({ locale, fallbackLocale, messages: messages2, watcher, formater: formater2 }) {
      this.locale = LOCALE_EN;
      this.fallbackLocale = LOCALE_EN;
      this.message = {};
      this.messages = {};
      this.watchers = [];
      if (fallbackLocale) {
        this.fallbackLocale = fallbackLocale;
      }
      this.formater = formater2 || defaultFormatter;
      this.messages = messages2 || {};
      this.setLocale(locale || LOCALE_EN);
      if (watcher) {
        this.watchLocale(watcher);
      }
    }
    setLocale(locale) {
      const oldLocale = this.locale;
      this.locale = normalizeLocale(locale, this.messages) || this.fallbackLocale;
      if (!this.messages[this.locale]) {
        this.messages[this.locale] = {};
      }
      this.message = this.messages[this.locale];
      if (oldLocale !== this.locale) {
        this.watchers.forEach((watcher) => {
          watcher(this.locale, oldLocale);
        });
      }
    }
    getLocale() {
      return this.locale;
    }
    watchLocale(fn) {
      const index = this.watchers.push(fn) - 1;
      return () => {
        this.watchers.splice(index, 1);
      };
    }
    add(locale, message, override = true) {
      const curMessages = this.messages[locale];
      if (curMessages) {
        if (override) {
          Object.assign(curMessages, message);
        } else {
          Object.keys(message).forEach((key) => {
            if (!hasOwn(curMessages, key)) {
              curMessages[key] = message[key];
            }
          });
        }
      } else {
        this.messages[locale] = message;
      }
    }
    f(message, values, delimiters) {
      return this.formater.interpolate(message, values, delimiters).join("");
    }
    t(key, locale, values) {
      let message = this.message;
      if (typeof locale === "string") {
        locale = normalizeLocale(locale, this.messages);
        locale && (message = this.messages[locale]);
      } else {
        values = locale;
      }
      if (!hasOwn(message, key)) {
        console.warn(`Cannot translate the value of keypath ${key}. Use the value of keypath as default.`);
        return key;
      }
      return this.formater.interpolate(message[key], values).join("");
    }
  }
  function watchAppLocale(appVm, i18n) {
    if (appVm.$watchLocale) {
      appVm.$watchLocale((newLocale) => {
        i18n.setLocale(newLocale);
      });
    } else {
      appVm.$watch(() => appVm.$locale, (newLocale) => {
        i18n.setLocale(newLocale);
      });
    }
  }
  function getDefaultLocale() {
    if (typeof uni !== "undefined" && uni.getLocale) {
      return uni.getLocale();
    }
    if (typeof global !== "undefined" && global.getLocale) {
      return global.getLocale();
    }
    return LOCALE_EN;
  }
  function initVueI18n(locale, messages2 = {}, fallbackLocale, watcher) {
    if (typeof locale !== "string") {
      const options = [
        messages2,
        locale
      ];
      locale = options[0];
      messages2 = options[1];
    }
    if (typeof locale !== "string") {
      locale = getDefaultLocale();
    }
    if (typeof fallbackLocale !== "string") {
      fallbackLocale = typeof __uniConfig !== "undefined" && __uniConfig.fallbackLocale || LOCALE_EN;
    }
    const i18n = new I18n({
      locale,
      fallbackLocale,
      messages: messages2,
      watcher
    });
    let t2 = (key, values) => {
      if (typeof getApp !== "function") {
        t2 = function(key2, values2) {
          return i18n.t(key2, values2);
        };
      } else {
        let isWatchedAppLocale = false;
        t2 = function(key2, values2) {
          const appVm = getApp().$vm;
          if (appVm) {
            appVm.$locale;
            if (!isWatchedAppLocale) {
              isWatchedAppLocale = true;
              watchAppLocale(appVm, i18n);
            }
          }
          return i18n.t(key2, values2);
        };
      }
      return t2(key, values);
    };
    return {
      i18n,
      f(message, values, delimiters) {
        return i18n.f(message, values, delimiters);
      },
      t(key, values) {
        return t2(key, values);
      },
      add(locale2, message, override = true) {
        return i18n.add(locale2, message, override);
      },
      watch(fn) {
        return i18n.watchLocale(fn);
      },
      getLocale() {
        return i18n.getLocale();
      },
      setLocale(newLocale) {
        return i18n.setLocale(newLocale);
      }
    };
  }
  const en = {
    "uni-popup.cancel": "cancel",
    "uni-popup.ok": "ok",
    "uni-popup.placeholder": "pleace enter",
    "uni-popup.title": "Hint",
    "uni-popup.shareTitle": "Share to"
  };
  const zhHans = {
    "uni-popup.cancel": "取消",
    "uni-popup.ok": "确定",
    "uni-popup.placeholder": "请输入",
    "uni-popup.title": "提示",
    "uni-popup.shareTitle": "分享到"
  };
  const zhHant = {
    "uni-popup.cancel": "取消",
    "uni-popup.ok": "確定",
    "uni-popup.placeholder": "請輸入",
    "uni-popup.title": "提示",
    "uni-popup.shareTitle": "分享到"
  };
  const messages = {
    en,
    "zh-Hans": zhHans,
    "zh-Hant": zhHant
  };
  const {
    t
  } = initVueI18n(messages);
  const _sfc_main$2 = {
    name: "uniPopupDialog",
    mixins: [popup],
    emits: ["confirm", "close", "update:modelValue", "input"],
    props: {
      inputType: {
        type: String,
        default: "text"
      },
      showClose: {
        type: Boolean,
        default: true
      },
      modelValue: {
        type: [Number, String],
        default: ""
      },
      placeholder: {
        type: [String, Number],
        default: ""
      },
      type: {
        type: String,
        default: "error"
      },
      mode: {
        type: String,
        default: "base"
      },
      title: {
        type: String,
        default: ""
      },
      content: {
        type: String,
        default: ""
      },
      beforeClose: {
        type: Boolean,
        default: false
      },
      cancelText: {
        type: String,
        default: ""
      },
      confirmText: {
        type: String,
        default: ""
      },
      maxlength: {
        type: Number,
        default: -1
      },
      focus: {
        type: Boolean,
        default: true
      }
    },
    data() {
      return {
        dialogType: "error",
        val: ""
      };
    },
    computed: {
      okText() {
        return this.confirmText || t("uni-popup.ok");
      },
      closeText() {
        return this.cancelText || t("uni-popup.cancel");
      },
      placeholderText() {
        return this.placeholder || t("uni-popup.placeholder");
      },
      titleText() {
        return this.title || t("uni-popup.title");
      }
    },
    watch: {
      type(val) {
        this.dialogType = val;
      },
      mode(val) {
        if (val === "input") {
          this.dialogType = "info";
        }
      },
      value(val) {
        if (this.maxlength != -1 && this.mode === "input") {
          this.val = val.slice(0, this.maxlength);
        } else {
          this.val = val;
        }
      },
      val(val) {
        this.$emit("update:modelValue", val);
      }
    },
    created() {
      this.popup.disableMask();
      if (this.mode === "input") {
        this.dialogType = "info";
        this.val = this.value;
        this.val = this.modelValue;
      } else {
        this.dialogType = this.type;
      }
    },
    methods: {
      /**
       * 点击确认按钮
       */
      onOk() {
        if (this.mode === "input") {
          this.$emit("confirm", this.val);
        } else {
          this.$emit("confirm");
        }
        if (this.beforeClose)
          return;
        this.popup.close();
      },
      /**
       * 点击取消按钮
       */
      closeDialog() {
        this.$emit("close");
        if (this.beforeClose)
          return;
        this.popup.close();
      },
      close() {
        this.popup.close();
      }
    }
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-popup-dialog" }, [
      vue.createElementVNode("view", { class: "uni-dialog-title" }, [
        vue.createElementVNode(
          "text",
          {
            class: vue.normalizeClass(["uni-dialog-title-text", ["uni-popup__" + $data.dialogType]])
          },
          vue.toDisplayString($options.titleText),
          3
          /* TEXT, CLASS */
        )
      ]),
      $props.mode === "base" ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "uni-dialog-content"
      }, [
        vue.renderSlot(_ctx.$slots, "default", {}, () => [
          vue.createElementVNode(
            "text",
            { class: "uni-dialog-content-text" },
            vue.toDisplayString($props.content),
            1
            /* TEXT */
          )
        ], true)
      ])) : (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "uni-dialog-content"
      }, [
        vue.renderSlot(_ctx.$slots, "default", {}, () => [
          vue.withDirectives(vue.createElementVNode("input", {
            class: "uni-dialog-input",
            maxlength: $props.maxlength,
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.val = $event),
            type: $props.inputType,
            placeholder: $options.placeholderText,
            focus: $props.focus
          }, null, 8, ["maxlength", "type", "placeholder", "focus"]), [
            [vue.vModelDynamic, $data.val]
          ])
        ], true)
      ])),
      vue.createElementVNode("view", { class: "uni-dialog-button-group" }, [
        $props.showClose ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "uni-dialog-button",
          onClick: _cache[1] || (_cache[1] = (...args) => $options.closeDialog && $options.closeDialog(...args))
        }, [
          vue.createElementVNode(
            "text",
            { class: "uni-dialog-button-text" },
            vue.toDisplayString($options.closeText),
            1
            /* TEXT */
          )
        ])) : vue.createCommentVNode("v-if", true),
        vue.createElementVNode(
          "view",
          {
            class: vue.normalizeClass(["uni-dialog-button", $props.showClose ? "uni-border-left" : ""]),
            onClick: _cache[2] || (_cache[2] = (...args) => $options.onOk && $options.onOk(...args))
          },
          [
            vue.createElementVNode(
              "text",
              { class: "uni-dialog-button-text uni-button-color" },
              vue.toDisplayString($options.okText),
              1
              /* TEXT */
            )
          ],
          2
          /* CLASS */
        )
      ])
    ]);
  }
  const __easycom_0 = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$1], ["__scopeId", "data-v-678a307f"], ["__file", "D:/HBuilderProjects/ztbook/node_modules/@dcloudio/uni-ui/lib/uni-popup-dialog/uni-popup-dialog.vue"]]);
  const defaultAvatar = "/static/default-avatar.png";
  const _sfc_main$1 = {
    __name: "settings",
    setup(__props, { expose: __expose }) {
      __expose();
      const { proxy } = vue.getCurrentInstance();
      const accountStore = useAccountStore();
      const budgetPopup = vue.ref(null);
      const userInfo = vue.ref({
        nickname: "",
        desc: "",
        avatar: ""
      });
      const budget = vue.computed(() => accountStore.budget);
      const budgetAlert = vue.ref(uni.getStorageSync("budgetAlert") || false);
      const darkMode = vue.ref(uni.getStorageSync("darkMode") || false);
      const cacheSize = vue.ref("0.00MB");
      function showBudgetModal() {
        uni.showModal({
          title: "设置月度预算",
          editable: true,
          placeholderText: "请输入预算金额",
          success: (res) => {
            if (res.confirm && res.content) {
              const amount = Number(res.content);
              if (!isNaN(amount) && amount > 0) {
                accountStore.setBudget(amount);
                uni.showToast({
                  title: "设置成功",
                  icon: "success"
                });
              }
            }
          }
        });
      }
      function toggleBudgetAlert(e) {
        budgetAlert.value = e.detail.value;
        uni.setStorageSync("budgetAlert", budgetAlert.value);
      }
      function toggleDarkMode(e) {
        darkMode.value = e.detail.value;
        uni.setStorageSync("darkMode", darkMode.value);
      }
      function navigateToCategories() {
        uni.showToast({
          title: "功能开发中",
          icon: "none"
        });
      }
      function navigateToTags() {
        uni.showToast({
          title: "功能开发中",
          icon: "none"
        });
      }
      function exportData() {
        const data = {
          accounts: accountStore.accounts,
          categories: accountStore.categories,
          tags: accountStore.tags,
          budget: accountStore.budget,
          exportTime: proxy.$dayjs().format("YYYY-MM-DD HH:mm:ss")
        };
        JSON.stringify(data, null, 2);
        uni.showToast({
          title: "功能开发中",
          icon: "none"
        });
      }
      function clearCache() {
        uni.showModal({
          title: "提示",
          content: "确定要清除缓存吗？",
          success: (res) => {
            if (res.confirm) {
              uni.clearStorageSync();
              uni.showToast({
                title: "清除成功",
                icon: "success"
              });
              getCacheSize();
            }
          }
        });
      }
      function getCacheSize() {
        uni.getStorageInfo({
          success: (res) => {
            const size = (res.currentSize / 1024).toFixed(2);
            cacheSize.value = size + "MB";
          }
        });
      }
      function showAbout() {
        uni.showModal({
          title: "关于我们",
          content: "这是一个简单的记账应用\n版本：1.0.0",
          showCancel: false
        });
      }
      vue.onMounted(() => {
        getCacheSize();
      });
      const __returned__ = { proxy, accountStore, budgetPopup, userInfo, defaultAvatar, budget, budgetAlert, darkMode, cacheSize, showBudgetModal, toggleBudgetAlert, toggleDarkMode, navigateToCategories, navigateToTags, exportData, clearCache, getCacheSize, showAbout, ref: vue.ref, computed: vue.computed, onMounted: vue.onMounted, getCurrentInstance: vue.getCurrentInstance, get useAccountStore() {
        return useAccountStore;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_popup_dialog = resolveEasycom(vue.resolveDynamicComponent("uni-popup-dialog"), __easycom_0);
    const _component_uni_popup = resolveEasycom(vue.resolveDynamicComponent("uni-popup"), __easycom_1);
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createCommentVNode(" 用户信息 "),
      vue.createElementVNode("view", { class: "user-info" }, [
        vue.createElementVNode("view", { class: "avatar" }, [
          vue.createElementVNode("image", {
            src: $setup.defaultAvatar,
            mode: "aspectFill"
          })
        ]),
        vue.createElementVNode("view", { class: "info" }, [
          vue.createElementVNode(
            "text",
            { class: "nickname" },
            vue.toDisplayString($setup.userInfo.nickname || "点击登录"),
            1
            /* TEXT */
          ),
          vue.createElementVNode(
            "text",
            { class: "desc" },
            vue.toDisplayString($setup.userInfo.desc || "登录后体验更多功能"),
            1
            /* TEXT */
          )
        ])
      ]),
      vue.createCommentVNode(" 设置列表 "),
      vue.createElementVNode("view", { class: "settings-list" }, [
        vue.createCommentVNode(" 预算设置 "),
        vue.createElementVNode("view", { class: "settings-group" }, [
          vue.createElementVNode("view", { class: "group-title" }, "预算管理"),
          vue.createElementVNode("view", {
            class: "settings-item",
            onClick: $setup.showBudgetModal
          }, [
            vue.createElementVNode("text", { class: "label" }, "月度预算"),
            vue.createElementVNode("view", { class: "value" }, [
              vue.createElementVNode(
                "text",
                null,
                "¥" + vue.toDisplayString($setup.budget),
                1
                /* TEXT */
              ),
              vue.createElementVNode("text", { class: "arrow" }, ">")
            ])
          ]),
          vue.createElementVNode("view", { class: "settings-item" }, [
            vue.createElementVNode("text", { class: "label" }, "预算提醒"),
            vue.createElementVNode("switch", {
              checked: $setup.budgetAlert,
              onChange: $setup.toggleBudgetAlert,
              color: "#3498db"
            }, null, 40, ["checked"])
          ])
        ]),
        vue.createCommentVNode(" 分类管理 "),
        vue.createElementVNode("view", { class: "settings-group" }, [
          vue.createElementVNode("view", { class: "group-title" }, "分类管理"),
          vue.createElementVNode("view", {
            class: "settings-item",
            onClick: $setup.navigateToCategories
          }, [
            vue.createElementVNode("text", { class: "label" }, "自定义分类"),
            vue.createElementVNode("text", { class: "arrow" }, ">")
          ]),
          vue.createElementVNode("view", {
            class: "settings-item",
            onClick: $setup.navigateToTags
          }, [
            vue.createElementVNode("text", { class: "label" }, "标签管理"),
            vue.createElementVNode("text", { class: "arrow" }, ">")
          ])
        ]),
        vue.createCommentVNode(" 数据管理 "),
        vue.createElementVNode("view", { class: "settings-group" }, [
          vue.createElementVNode("view", { class: "group-title" }, "数据管理"),
          vue.createElementVNode("view", {
            class: "settings-item",
            onClick: $setup.exportData
          }, [
            vue.createElementVNode("text", { class: "label" }, "导出账单"),
            vue.createElementVNode("text", { class: "arrow" }, ">")
          ]),
          vue.createElementVNode("view", {
            class: "settings-item",
            onClick: _cache[0] || (_cache[0] = (...args) => _ctx.showBackupModal && _ctx.showBackupModal(...args))
          }, [
            vue.createElementVNode("text", { class: "label" }, "数据备份"),
            vue.createElementVNode("text", { class: "arrow" }, ">")
          ])
        ]),
        vue.createCommentVNode(" 其他设置 "),
        vue.createElementVNode("view", { class: "settings-group" }, [
          vue.createElementVNode("view", { class: "group-title" }, "其他设置"),
          vue.createElementVNode("view", { class: "settings-item" }, [
            vue.createElementVNode("text", { class: "label" }, "深色模式"),
            vue.createElementVNode("switch", {
              checked: $setup.darkMode,
              onChange: $setup.toggleDarkMode,
              color: "#3498db"
            }, null, 40, ["checked"])
          ]),
          vue.createElementVNode("view", {
            class: "settings-item",
            onClick: $setup.clearCache
          }, [
            vue.createElementVNode("text", { class: "label" }, "清除缓存"),
            vue.createElementVNode(
              "text",
              { class: "value" },
              vue.toDisplayString($setup.cacheSize),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", {
            class: "settings-item",
            onClick: $setup.showAbout
          }, [
            vue.createElementVNode("text", { class: "label" }, "关于我们"),
            vue.createElementVNode("text", { class: "arrow" }, ">")
          ])
        ])
      ]),
      vue.createCommentVNode(" 预算设置弹窗 "),
      vue.createVNode(
        _component_uni_popup,
        {
          ref: "budgetPopup",
          type: "dialog"
        },
        {
          default: vue.withCtx(() => [
            vue.createVNode(_component_uni_popup_dialog, {
              mode: "input",
              title: "设置月度预算",
              placeholder: "请输入预算金额",
              value: String($setup.budget),
              onConfirm: _ctx.setBudget
            }, null, 8, ["value", "onConfirm"])
          ]),
          _: 1
          /* STABLE */
        },
        512
        /* NEED_PATCH */
      )
    ]);
  }
  const PagesSettingsSettings = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render], ["__scopeId", "data-v-7fad0a1c"], ["__file", "D:/HBuilderProjects/ztbook/pages/settings/settings.vue"]]);
  __definePage("pages/index/index", PagesIndexIndex);
  __definePage("pages/add/add", PagesAddAdd);
  __definePage("pages/list/list", PagesListList);
  __definePage("pages/statistics/statistics", PagesStatisticsStatistics);
  __definePage("pages/settings/settings", PagesSettingsSettings);
  const _sfc_main = {
    onLaunch: function() {
      formatAppLog("log", "at App.vue:4", "App Launch");
    },
    onShow: function() {
      formatAppLog("log", "at App.vue:7", "App Show");
    },
    onHide: function() {
      formatAppLog("log", "at App.vue:10", "App Hide");
    }
  };
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "D:/HBuilderProjects/ztbook/App.vue"]]);
  function createApp() {
    const app = vue.createVueApp(App);
    const pinia = createPinia();
    app.use(pinia);
    app.config.globalProperties.$dayjs = dayjs;
    return {
      app
    };
  }
  const { app: __app__, Vuex: __Vuex__, Pinia: __Pinia__ } = createApp();
  uni.Vuex = __Vuex__;
  uni.Pinia = __Pinia__;
  __app__.provide("__globalStyles", __uniConfig.styles);
  __app__._component.mpType = "app";
  __app__._component.render = () => {
  };
  __app__.mount("#app");
})(Vue);
