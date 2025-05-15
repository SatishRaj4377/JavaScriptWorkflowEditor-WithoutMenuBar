var Diagram = ej.diagrams.Diagram;
var UndoRedo = ej.diagrams.UndoRedo;
var SnapConstraints = ej.diagrams.SnapConstraints;
var BpmnDiagrams = ej.diagrams.BpmnDiagrams;
var DiagramTools = ej.diagrams.DiagramTools;
var NodeConstraints = ej.diagrams.NodeConstraints;
var AnnotationConstraints = ej.diagrams.AnnotationConstraints;
var SelectorConstraints = ej.diagrams.SelectorConstraints;
var randomId = ej.diagrams.randomId;

// Inject required modules
Diagram.Inject(UndoRedo, BpmnDiagrams);

var flowTimeOut1, flowTimeOut2;
let isPaused = false;
const animationIntervals = [];
const currentDiagramLayout = 'foodProductionWorkflow';
const connectorBeforeAnimationColor = '#B0B0B0';
const connectorDuringAnimationColor = '#FF7F50';
const connectorAfterAnimationColor = 'green';
const connectorAnnotationColor = '#32CD32';
const nodeStrokeBeforeAnimationColor = 'black';
const nodeStrokeAfterAnimationColor = 'green';

function loadDiagramLayout(layoutName) {
  fetch('./data/data-source.json') 
    .then(response => response.json())
    .then(data => {
      const layout = data[layoutName];
      if (layout) {
        diagram.clear();
        // Add nodes to the diagram
        layout.nodes.forEach(node => {
          diagram.add(node);
        });

        // Add connectors to the diagram
        layout.connectors.forEach(connector => {
          diagram.add(connector);
        });
        diagram.fitToPage();
      } else {
        console.error('Layout not found:', layoutName);
      }
    })
    .catch(error => console.error('Error loading diagram layout:', error));
}

// Node defaults
function getNodeDefaults(node) {

  node.constraints = (ej.diagrams.NodeConstraints.Default & ~ej.diagrams.NodeConstraints.Rotate) | ej.diagrams.NodeConstraints.HideThumbs;

  const draggedFromPalette = node?.addInfo && node.addInfo.fromPalette;

  // Set default width and height only if not already defined
  if (typeof node.width === 'undefined') {
    if (node.shape.shape === 'Event') {
      node.width = 60;
    } else if (node.shape.shape === 'Gateway') {
      node.width = 90;
    } else if (node.shape.shape === 'Activity') {
      node.width = 90;
    }
  }

  if (typeof node.height === 'undefined') {
    if (node.shape.shape === 'Event') {
      node.height = 60;
    } else if (node.shape.shape === 'Gateway') {
      node.height = 70;
    } else if (node.shape.shape === 'Activity') {
      node.height = 50;
    }
  }
  
  if (draggedFromPalette) {
    if (node.shape.shape === 'Event') {
      node.annotations = [{ content: node.shape.event.event === "End" ? 'End' : 'Start' }];
    } else if (node.shape.shape === 'Gateway') {
      node.annotations = [{ content: 'Decision' }];
    } else if (node.shape.shape === 'Activity') {
      node.annotations = [{ content: 'Task' }];
    }
  } else {
    updateNodeWidthBasedOnAnnotation(node);
  }

  return node;
}

// Connector defaults
function getConnectorDefaults(connector) {
  connector.type = 'Straight';
  connector.segments = [{ type: 'Straight' }];
  connector.style.strokeColor = connector.targetDecorator.style.strokeColor = connector.targetDecorator.style.fill = connectorBeforeAnimationColor;

  connector.annotations = [{
    content: '',
    height: 16,
    width: 16,
    offset: 0,
    margin: 0,
    style: { fill: 'transparent', fontSize: 24 }
  }];
  return connector;
}

// User handles
var userHandles = [
  { name: 'delete', pathData: 'M0.97,3.04 L12.78,3.04 L12.78,12.21 C12.78,12.64,12.59,13,12.2,13.3 C11.82,13.6,11.35,13.75,10.8,13.75 L2.95,13.75 C2.4,13.75,1.93,13.6,1.55,13.3 C1.16,13,0.97,12.64,0.97,12.21 Z M4.43,0 L9.32,0 L10.34,0.75 L13.75,0.75 L13.75,2.29 L0,2.29 L0,0.75 L3.41,0.75 Z', tooltip: { content: 'Delete Node' }, side: 'Bottom', offset: 0.5, margin: { bottom: 5 }, disableConnectors: true },
  { name: 'drawConnector', pathData: 'M6.09,0 L13.75,6.88 L6.09,13.75 L6.09,9.64 L0,9.64 L0,4.11 L6.09,4.11 Z', tooltip: { content: 'Draw Connector' }, side: 'Right', offset: 0.5, margin: { right: 5 }, disableConnectors: true }
];

// Initialize Diagram
var diagram = new Diagram({
  width: '100%', height: '100%', mode: 'SVG',
  snapSettings: { constraints: SnapConstraints.All },
  rulerSettings: { showRulers: true },
  scrollSettings: { scrollLimit: 'Infinity', canAutoScroll: true },
  tool: DiagramTools.ZoomPan,
  getNodeDefaults: getNodeDefaults,
  getConnectorDefaults: getConnectorDefaults,
  created: function() {
    loadDiagramLayout(currentDiagramLayout)
  },
  selectedItems: { userHandles: userHandles}
});
diagram.appendTo('#diagram');

// User handle functionality
diagram.onUserHandleMouseDown = function(args) {
  var handleName = args.element.name;
  switch (handleName) {
    case 'delete': 
      diagram.remove(diagram.selectedItems.nodes[0]); 
      break;
    case 'drawConnector':
      var sourceNode = diagram.selectedItems.nodes[0];
      if (!sourceNode) return;
      diagram.drawingObject = { type: 'Straight', sourceID: sourceNode.id };
      diagram.tool = DiagramTools.DrawOnce;
      break;
  }
};


function updateNodeWidthBasedOnAnnotation(node) {

  if (!node || node.shape.shape !== 'Activity') {
    return; // Only update for task nodes
  }

  // Measure the annotation text width
  node.annotations.forEach(annotation => {
    const textWidth = getTextWidth(annotation.content??'', annotation.style.fontSize + 'px ' + annotation.style.fontFamily);
    const padding = 20; 
    const defaultNodeWidth = 90;
    if (textWidth+ padding > defaultNodeWidth){
      node.width = textWidth + padding;
    }else{
      node.width = defaultNodeWidth;
    }
  });
  diagram.dataBind();
}

const getTextWidth = (text, font) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = font;
  const lines = text.split('\n');
  const widths = lines.map(line => context.measureText(line).width);
  return Math.max(...widths);
};

// Workflow animation
function startWorkflow() {
  // === PAUSE if running ===
  if (!isPaused && animationIntervals.length) {
    isPaused = true;
    window.updateExecuteButton('Resume');
    animationIntervals.forEach(clearInterval);
    animationIntervals.length = 0;
    return;
  }

  // === RESUME if paused ===
  if (isPaused) {
    isPaused = false;
    window.updateExecuteButton('Pause');
    resumeWorkflow();
    return;
  }

  // === FRESH START ===
  isPaused = false;
  resetWorkflow(false);
  window.updateExecuteButton('Pause');

  // — your original start logic below —
  var startNodes = diagram.nodes.filter(node => {
    return node.shape && node.shape.type === 'Bpmn'
        && node.shape.shape === 'Event'
        && node.shape.event.event === 'Start';
  });
  if (startNodes.length === 0) {
    console.error("No start nodes found.");
    return;
  }
  startNodes.forEach(startNode => animateNode(startNode.id));
}

function resumeWorkflow() {
  diagram.connectors.forEach(connector => {
    const lastAnn = connector.annotations[connector.annotations.length - 1];

    if (lastAnn && lastAnn.offset > 0 && lastAnn.offset < 0.9) {
      // Restore the annotations that need to be visible
      lastAnn.content = '●';
      if (lastAnn.style) lastAnn.style.color = connectorAnnotationColor;

      const sourceNode = diagram.getObject(connector.sourceID);
      const isStartNode = sourceNode &&
        sourceNode.shape?.type === 'Bpmn' &&
        sourceNode.shape?.shape === 'Event' &&
        sourceNode.shape?.event?.event === 'Start';

      if (isStartNode || (sourceNode && sourceNode.style.strokeColor === nodeStrokeAfterAnimationColor)) {
        animateConnector(connector, targetId => {
          const targetNode = diagram.getObject(targetId);
          if (targetNode) {
            createLoadingAnimation(targetNode);
            setTimeout(() => {
              completeNodeAnimation(targetNode);
              animateNode(targetId);
            }, 1000);
          }
        });
      }
    }
  });
}

function completeNodeAnimation(node) {
  document.querySelectorAll('.loading-indicator').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.tick').forEach(el => el.style.display = 'block');

  if (node.style) {
    node.style.strokeColor = nodeStrokeAfterAnimationColor;
  }
  diagram.dataBind();
}

function animateNode(nodeId) {
  var currentConnectors = diagram.connectors.filter(conn => conn.sourceID === nodeId);
  currentConnectors.forEach(connector => {
    // Check if additional info contains "stopAnimation"
    if (connector.addInfo?.stopAnimation !== "true") {
      animateConnector(connector, function (targetNodeId) {
        var targetNode = diagram.getObject(targetNodeId);
        if (targetNode) {
          createLoadingAnimation(targetNode);

          flowTimeOut1 = setTimeout(() => {
            Array.prototype.slice
              .call(document.getElementsByClassName("loading-indicator"))
              .forEach(function (el) {
                el.style.display = "none";
              });
            Array.prototype.slice
              .call(document.getElementsByClassName("tick"))
              .forEach(function (el) {
                el.style.display = "block";
              });

            targetNode.style.strokeColor = nodeStrokeAfterAnimationColor;
            diagram.dataBind();
            // If it’s a BPMN End event, reset the toolbar
            if (
              targetNode.shape?.type === "Bpmn" &&
              targetNode.shape?.shape === "Event" &&
              targetNode.shape?.event?.event === "End"
            ) {
              window.updateExecuteButton("Execute");
              animationIntervals.forEach(clearInterval);
              animationIntervals.length = 0; // Reset the array
            } else {
              animateNode(targetNodeId);
            }
          }, 1000);
        }
      });
    }
  });
}

function animateConnector(connector, callback) {
  const lastAnn = connector.annotations[connector.annotations.length - 1];
  lastAnn.offset = lastAnn.offset || 0;
  lastAnn.content = '●';
  lastAnn.style.color = connectorAnnotationColor;
  diagram.dataBind();

  const flowInterval = setInterval(() => {
    if (isPaused) {
      return;  // freeze in place until resumed
    }
    if (lastAnn.offset < 0.9) {
      lastAnn.offset += 0.025;
      connector.style.strokeColor =
        connector.targetDecorator.style.strokeColor =
        connector.targetDecorator.style.fill =
          connectorDuringAnimationColor;
      diagram.dataBind();
    } else {
      clearInterval(flowInterval);
      lastAnn.style.color = 'transparent';
      connector.style.strokeColor =
        connector.targetDecorator.style.strokeColor =
        connector.targetDecorator.style.fill =
          connectorAfterAnimationColor;
      diagram.dataBind();
      callback(connector.targetID);
    }
  }, 120);

  animationIntervals.push(flowInterval);
}


function createLoadingAnimation(targetNode) {
  var newNode = {
    id: randomId(),
    width: 15,
    height: 15,
    offsetX: targetNode.wrapper.bounds.left + 1,
    offsetY: targetNode.wrapper.bounds.top + 2,
    shape: {
      type: 'HTML',
      content: '<div style="display: flex; flex-direction: column; align-items: center;"><div class="loading-indicator"></div><div class="tick"><i class="e-icons e-check-2"></i></div></div>'
    }
  };
  diagram.add(newNode);
}

function resetWorkflow(fullReset = true) {
  clearTimeout(flowTimeOut1);
  clearTimeout(flowTimeOut2);

  animationIntervals.forEach(clearInterval);
  animationIntervals.length = 0; // Reset the array

  // Clear all custom animations, ticks, and spinners
  document.querySelectorAll('.loading-indicator, .tick').forEach(el => {
    el.remove();
  });

  // Restore nodes and connectors to their default states
  diagram.nodes.forEach(node => {
    if (node.style) node.style.strokeColor = nodeStrokeBeforeAnimationColor; 
  });

  diagram.connectors.forEach(connector => {
    connector.style.strokeColor = connector.targetDecorator.style.strokeColor = connector.targetDecorator.style.fill = connectorBeforeAnimationColor;

    // Reset connector annotations properly
    connector.annotations.forEach(ann => {
      ann.offset = 0; // Reset the offset to start position
      ann.content = ''; // Reset content if specific animation is added
      ann.style.color = connectorAnnotationColor; // Ensure color matches initial state
    });
  });

  diagram.dataBind(); // Ensure all changes are applied

  if (fullReset){
    // Reload the diagram with the default layout
    loadDiagramLayout(currentDiagramLayout);
  }
}