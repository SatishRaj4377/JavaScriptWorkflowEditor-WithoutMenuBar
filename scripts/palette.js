(function () {
  // Initialize SymbolPalette
  var palette = new ej.diagrams.SymbolPalette({
    enableAnimation: false,
    showHeader: false,
    palettes: [
      {
        id: "BPMN",
        expanded: true,
        symbols: [
          {
            id: "Start",
            shape: { type: "Bpmn", shape: "Event" },
            addInfo: { fromPalette: true },
            tooltip: { content: "Start", relativeMode: "Object" },
            constraints:
              ej.diagrams.NodeConstraints.Default |
              ej.diagrams.NodeConstraints.Tooltip,
          },
          {
            id: "Decision",
            shape: { type: "Bpmn", shape: "Gateway" },
            addInfo: { fromPalette: true },
            tooltip: { content: "Decision", relativeMode: "Object" },
            constraints:
              ej.diagrams.NodeConstraints.Default |
              ej.diagrams.NodeConstraints.Tooltip,
          },
          {
            id: "Task",
            shape: { type: "Bpmn", shape: "Activity" },
            addInfo: { fromPalette: true },
            tooltip: { content: "Task", relativeMode: "Object" },
            constraints:
              ej.diagrams.NodeConstraints.Default |
              ej.diagrams.NodeConstraints.Tooltip,
          },
          {
            id: "End",
            shape: { type: "Bpmn", shape: "Event", event: { event: "End", trigger: "None" } },
            addInfo: { fromPalette: true },
            tooltip: { content: "End", relativeMode: "Object" },
            constraints:
              ej.diagrams.NodeConstraints.Default |
              ej.diagrams.NodeConstraints.Tooltip,
          }
        ],
        iconCss: "",
      },
    ],
    width: "100%",
    height: "100%",
    symbolHeight: 45,
    symbolWidth: 45,
    getSymbolInfo: function (symbol) {
      return { fit: true };
    },
    paletteExpanding: function (args) {
      args.cancel = true;
    },
  });
  palette.appendTo("#symbolPalette");
})();
