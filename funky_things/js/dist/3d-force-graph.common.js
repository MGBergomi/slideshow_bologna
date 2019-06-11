'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var three = require('three');
var tinycolor = _interopDefault(require('tinycolor2'));
var ThreeTrackballControls = _interopDefault(require('three-trackballcontrols'));
var ThreeDragControls = _interopDefault(require('three-dragcontrols'));
var ThreeForceGraph = _interopDefault(require('three-forcegraph'));
var accessorFn = _interopDefault(require('accessor-fn'));
var Kapsule = _interopDefault(require('kapsule'));

function styleInject(css, ref) {
  if (ref === void 0) ref = {};
  var insertAt = ref.insertAt;

  if (!css || typeof document === 'undefined') {
    return;
  }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css = ".graph-nav-info {\n  bottom: 5px;\n  width: 100%;\n  text-align: center;\n  color: slategrey;\n  opacity: 0.7;\n  font-size: 10px;\n}\n\n.graph-info-msg {\n  top: 50%;\n  width: 100%;\n  text-align: center;\n  color: lavender;\n  opacity: 0.7;\n  font-size: 22px;\n}\n\n.graph-tooltip {\n  color: lavender;\n  font-size: 18px;\n  transform: translate(-50%, 25px);\n}\n\n.graph-info-msg, .graph-nav-info, .graph-tooltip {\n  position: absolute;\n  font-family: Sans-serif;\n}\n\n.grabbable {\n  cursor: move;\n  cursor: grab;\n  cursor: -moz-grab;\n  cursor: -webkit-grab;\n}\n\n.grabbable:active {\n  cursor: grabbing;\n  cursor: -moz-grabbing;\n  cursor: -webkit-grabbing;\n}";
styleInject(css);

function linkKapsule (kapsulePropName, kapsuleType) {

  var dummyK = new kapsuleType(); // To extract defaults

  return {
    linkProp: function linkProp(prop) {
      // link property config
      return {
        default: dummyK[prop](),
        onChange: function onChange(v, state) {
          state[kapsulePropName][prop](v);
        },

        triggerUpdate: false
      };
    },
    linkMethod: function linkMethod(method) {
      // link method pass-through
      return function (state) {
        var kapsuleInstance = state[kapsulePropName];

        for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }

        var returnVal = kapsuleInstance[method].apply(kapsuleInstance, args);

        return returnVal === kapsuleInstance ? this // chain based on the parent object, not the inner kapsule
        : returnVal;
      };
    }
  };
}

var defineProperty = function (obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
};

var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

var three$1 = window.THREE ? window.THREE // Prefer consumption from global THREE, if exists
: {
  WebGLRenderer: three.WebGLRenderer,
  Scene: three.Scene,
  PerspectiveCamera: three.PerspectiveCamera,
  AmbientLight: three.AmbientLight,
  DirectionalLight: three.DirectionalLight,
  Raycaster: three.Raycaster,
  Vector2: three.Vector2,
  Vector3: three.Vector3,
  Color: three.Color
};

//

var CAMERA_DISTANCE2NODES_FACTOR = 150;

//

// Expose config from forceGraph
var bindFG = linkKapsule('forceGraph', ThreeForceGraph);
var linkedFGProps = Object.assign.apply(Object, toConsumableArray(['jsonUrl', 'graphData', 'numDimensions', 'nodeRelSize', 'nodeId', 'nodeVal', 'nodeResolution', 'nodeColor', 'nodeAutoColorBy', 'nodeOpacity', 'nodeThreeObject', 'linkSource', 'linkTarget', 'linkColor', 'linkAutoColorBy', 'linkOpacity', 'linkWidth', 'linkResolution', 'linkDirectionalParticles', 'linkDirectionalParticleSpeed', 'linkDirectionalParticleWidth', 'linkDirectionalParticleColor', 'linkDirectionalParticleResolution', 'forceEngine', 'd3AlphaDecay', 'd3VelocityDecay', 'warmupTicks', 'cooldownTicks', 'cooldownTime'].map(function (p) {
  return defineProperty({}, p, bindFG.linkProp(p));
})));
var linkedFGMethods = Object.assign.apply(Object, toConsumableArray(['d3Force'].map(function (p) {
  return defineProperty({}, p, bindFG.linkMethod(p));
})));

//

var _3dForceGraph = Kapsule({

  props: _extends({
    width: { default: window.innerWidth },
    height: { default: window.innerHeight },
    backgroundColor: {
      default: '#000011',
      onChange: function onChange(bckgColor, state) {
        var alpha = tinycolor(bckgColor).getAlpha();
        state.renderer.setClearColor(new three$1.Color(bckgColor), alpha);
      },

      triggerUpdate: false
    },
    showNavInfo: { default: true },
    nodeLabel: { default: 'name', triggerUpdate: false },
    linkLabel: { default: 'name', triggerUpdate: false },
    linkHoverPrecision: { default: 1, triggerUpdate: false },
    enablePointerInteraction: { default: true, onChange: function onChange(_, state) {
        state.hoverObj = null;
      },
      triggerUpdate: false },
    enableNodeDrag: { default: true, triggerUpdate: false },
    onNodeClick: { default: function _default() {}, triggerUpdate: false },
    onNodeHover: { default: function _default() {}, triggerUpdate: false },
    onLinkClick: { default: function _default() {}, triggerUpdate: false },
    onLinkHover: { default: function _default() {}, triggerUpdate: false }
  }, linkedFGProps),

  aliases: { // Prop names supported for backwards compatibility
    nameField: 'nodeLabel',
    idField: 'nodeId',
    valField: 'nodeVal',
    colorField: 'nodeColor',
    autoColorBy: 'nodeAutoColorBy',
    linkSourceField: 'linkSource',
    linkTargetField: 'linkTarget',
    linkColorField: 'linkColor',
    lineOpacity: 'linkOpacity'
  },

  methods: _extends({
    cameraPosition: function cameraPosition(state, position, lookAt) {
      // Setter
      if (position) {
        var x = position.x,
            y = position.y,
            z = position.z;

        if (x !== undefined) state.camera.position.x = x;
        if (y !== undefined) state.camera.position.y = y;
        if (z !== undefined) state.camera.position.z = z;

        state.tbControls.target = lookAt ? new three$1.Vector3(lookAt.x, lookAt.y, lookAt.z) : state.forceGraph.position;

        return this;
      }

      // Getter
      return state.camera.position;
    },
    stopAnimation: function stopAnimation(state) {
      if (state.animationFrameRequestId) {
        cancelAnimationFrame(state.animationFrameRequestId);
      }
      return this;
    }
  }, linkedFGMethods),

  stateInit: function stateInit() {
    return {
      renderer: new three$1.WebGLRenderer({ alpha: true }),
      scene: new three$1.Scene(),
      camera: new three$1.PerspectiveCamera(),
      lastSetCameraZ: 0,
      forceGraph: new ThreeForceGraph()
    };
  },

  init: function init(domNode, state) {
    // Wipe DOM
    domNode.innerHTML = '';

    // Add relative container
    domNode.appendChild(state.container = document.createElement('div'));
    state.container.style.position = 'relative';

    // Add nav info section
    state.container.appendChild(state.navInfo = document.createElement('div'));
    state.navInfo.className = 'graph-nav-info';
    state.navInfo.textContent = "";

    // Add info space
    var infoElem = void 0;
    state.container.appendChild(infoElem = document.createElement('div'));
    infoElem.className = 'graph-info-msg';
    infoElem.textContent = '';
    state.forceGraph.onLoading(function () {
      infoElem.textContent = 'Loading...';
    });
    state.forceGraph.onFinishLoading(function () {
      infoElem.textContent = '';

      // sync graph data structures
      state.graphData = state.forceGraph.graphData();

      // re-aim camera, if still in default position (not user modified)
      if (state.camera.position.x === 0 && state.camera.position.y === 0 && state.camera.position.z === state.lastSetCameraZ) {
        state.camera.lookAt(state.forceGraph.position);
        state.lastSetCameraZ = state.camera.position.z = Math.cbrt(state.graphData.nodes.length) * CAMERA_DISTANCE2NODES_FACTOR;
      }

      // Setup node drag interaction
      if (state.enableNodeDrag && state.enablePointerInteraction && state.forceEngine === 'd3') {
        // Can't access node positions programatically in ngraph
        var dragControls = new ThreeDragControls(state.graphData.nodes.map(function (node) {
          return node.__threeObj;
        }), state.camera, state.renderer.domElement);

        dragControls.addEventListener('dragstart', function (event) {
          state.tbControls.enabled = false; // Disable trackball controls while dragging

          var node = event.object.__data;
          node.__initialFixedPos = { fx: node.fx, fy: node.fy, fz: node.fz };

          // lock node
          ['x', 'y', 'z'].forEach(function (c) {
            return node['f' + c] = node[c];
          });

          // keep engine running at low intensity throughout drag
          state.forceGraph.d3AlphaTarget(0.3);

          // drag cursor
          state.renderer.domElement.classList.add('grabbable');
        });

        dragControls.addEventListener('drag', function (event) {
          state.ignoreOneClick = true; // Don't click the node if it's being dragged

          var node = event.object.__data;

          // Move fx/fy/fz (and x/y/z) of nodes based on object new position
          ['x', 'y', 'z'].forEach(function (c) {
            return node['f' + c] = node[c] = event.object.position[c];
          });

          // prevent freeze while dragging
          state.forceGraph.resetCountdown();
        });

        dragControls.addEventListener('dragend', function (event) {
          var node = event.object.__data;
          var initPos = node.__initialFixedPos;

          if (initPos) {
            ['x', 'y', 'z'].forEach(function (c) {
              var fc = 'f' + c;
              if (initPos[fc] === undefined) {
                node[fc] = undefined;
              }
            });
            delete node.__initialFixedPos;
          }

          state.forceGraph.d3AlphaTarget(0) // release engine low intensity
          .resetCountdown(); // let the engine readjust after releasing fixed nodes

          state.tbControls.enabled = true; // Re-enable trackball controls

          // clear cursor
          state.renderer.domElement.classList.remove('grabbable');
        });
      }
    });

    // Setup tooltip
    var toolTipElem = document.createElement('div');
    toolTipElem.classList.add('graph-tooltip');
    state.container.appendChild(toolTipElem);

    // Capture mouse coords on move
    var raycaster = new three$1.Raycaster();
    var mousePos = new three$1.Vector2();
    mousePos.x = -2; // Initialize off canvas
    mousePos.y = -2;
    state.container.addEventListener("mousemove", function (ev) {
      // update the mouse pos
      var offset = getOffset(state.container),
          relPos = {
        x: ev.pageX - offset.left,
        y: ev.pageY - offset.top
      };
      mousePos.x = relPos.x / state.width * 2 - 1;
      mousePos.y = -(relPos.y / state.height) * 2 + 1;

      // Move tooltip
      toolTipElem.style.top = relPos.y + 'px';
      toolTipElem.style.left = relPos.x + 'px';

      function getOffset(el) {
        var rect = el.getBoundingClientRect(),
            scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
            scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
      }
    }, false);

    // Handle click events on nodes
    state.container.addEventListener("click", function (ev) {
      if (state.ignoreOneClick) {
        // f.e. because of dragend event
        state.ignoreOneClick = false;
        return;
      }

      if (state.hoverObj) {
        state['on' + (state.hoverObj.__graphObjType === 'node' ? 'Node' : 'Link') + 'Click'](state.hoverObj.__data);
      }
    }, false);

    // Setup renderer, camera and controls
    state.container.appendChild(state.renderer.domElement);
    state.tbControls = new ThreeTrackballControls(state.camera, state.renderer.domElement);
    state.tbControls.minDistance = 0.1;
    state.tbControls.maxDistance = 20000;

    state.renderer.setSize(state.width, state.height);
    state.camera.far = 20000;

    // Populate scene
    state.scene.add(state.forceGraph);
    state.scene.add(new three$1.AmbientLight(0xbbbbbb));
    state.scene.add(new three$1.DirectionalLight(0xffffff, 0.6));

    //

    // Kick-off renderer
    (function animate() {
      // IIFE
      if (state.enablePointerInteraction) {
        // Update tooltip and trigger onHover events
        raycaster.linePrecision = state.linkHoverPrecision;

        raycaster.setFromCamera(mousePos, state.camera);
        var intersects = raycaster.intersectObjects(state.forceGraph.children).filter(function (o) {
          return ['node', 'link'].indexOf(o.object.__graphObjType) !== -1;
        }) // Check only node/link objects
        .sort(function (a, b) {
          // Prioritize nodes over links
          var isNode = function isNode(o) {
            return o.object.__graphObjType === 'node';
          };
          return isNode(b) - isNode(a);
        });

        var topObject = intersects.length ? intersects[0].object : null;

        if (topObject !== state.hoverObj) {
          var prevObjType = state.hoverObj ? state.hoverObj.__graphObjType : null;
          var prevObjData = state.hoverObj ? state.hoverObj.__data : null;
          var objType = topObject ? topObject.__graphObjType : null;
          var objData = topObject ? topObject.__data : null;
          if (prevObjType && prevObjType !== objType) {
            // Hover out
            state['on' + (prevObjType === 'node' ? 'Node' : 'Link') + 'Hover'](null, prevObjData);
          }
          if (objType) {
            // Hover in
            state['on' + (objType === 'node' ? 'Node' : 'Link') + 'Hover'](objData, prevObjType === objType ? prevObjData : null);
          }

          toolTipElem.innerHTML = topObject ? accessorFn(state[objType + 'Label'])(objData) || '' : '';

          state.hoverObj = topObject;
        }

        // reset canvas cursor (override dragControls cursor)
        state.renderer.domElement.style.cursor = null;
      }

      // Frame cycle
      state.forceGraph.tickFrame();
      state.tbControls.update();
      state.renderer.render(state.scene, state.camera);
      state.animationFrameRequestId = requestAnimationFrame(animate);
    })();
  },

  update: function updateFn(state) {
    // resize canvas
    if (state.width && state.height) {
      state.container.style.width = state.width;
      state.container.style.height = state.height;
      state.renderer.setSize(state.width, state.height);
      state.camera.aspect = state.width / state.height;
      state.camera.updateProjectionMatrix();
    }

    state.navInfo.style.display = state.showNavInfo ? null : 'none';
  }

});

module.exports = _3dForceGraph;
